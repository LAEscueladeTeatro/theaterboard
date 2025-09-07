const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// El authMiddleware se aplicará globalmente a estas rutas en server.js

/**
 * @route   GET /api/reports/student-summary
 * @desc    Obtener resumen de puntos de un estudiante para un mes específico.
 * @access  Private (Teacher)
 * @query   studentId=ET001, month=YYYY-MM
 */
router.get('/student-summary', async (req, res) => {
  const { studentId, month } = req.query; // month en formato YYYY-MM

  if (!studentId || !month) {
    return res.status(400).json({ message: 'studentId y month (YYYY-MM) son requeridos.' });
  }

  // Validar formato de month (YYYY-MM)
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'El formato de month debe ser YYYY-MM.' });
  }

  const client = await pool.connect();
  try {
    const studentQuery = 'SELECT id, full_name, nickname FROM students WHERE id = $1';
    const studentResult = await client.query(studentQuery, [studentId]);

    if (studentResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    const studentInfo = studentResult.rows[0];

    // 1. Puntos de Asistencia (attendance_records: points_earned + base_attendance_points)
    const attendancePointsQuery = `
      SELECT
        COALESCE(SUM(points_earned), 0) AS status_points,
        COALESCE(SUM(base_attendance_points), 0) AS presence_points
      FROM attendance_records
      WHERE student_id = $1 AND TO_CHAR(attendance_date, 'YYYY-MM') = $2;
    `;
    const attendancePointsResult = await client.query(attendancePointsQuery, [studentId, month]);
    const { status_points, presence_points } = attendancePointsResult.rows[0];
    const totalAttendancePoints = parseInt(status_points, 10) + parseInt(presence_points, 10);

    // 2. Puntos de Bono Madrugador (daily_bonus_log)
    const bonusPointsQuery = `
      SELECT COALESCE(SUM(points_awarded), 0) AS total_bonus
      FROM daily_bonus_log
      WHERE student_id = $1 AND TO_CHAR(bonus_date, 'YYYY-MM') = $2;
    `;
    const bonusPointsResult = await client.query(bonusPointsQuery, [studentId, month]);
    const totalBonusPoints = parseInt(bonusPointsResult.rows[0].total_bonus, 10);

    // 3. Puntos de Scores Adicionales (score_records)
    const scoresQuery = `
      SELECT score_type, COALESCE(SUM(points_assigned), 0) AS total_score_type_points
      FROM score_records
      WHERE student_id = $1 AND TO_CHAR(score_date, 'YYYY-MM') = $2
      GROUP BY score_type;
    `;
    const scoresResult = await client.query(scoresQuery, [studentId, month]);
    const detailedScores = {};
    let totalAdditionalScores = 0;
    scoresResult.rows.forEach(row => {
      detailedScores[row.score_type] = parseInt(row.total_score_type_points, 10);
      totalAdditionalScores += parseInt(row.total_score_type_points, 10);
    });

    // Calcular el gran total
    const grandTotalPoints = totalAttendancePoints + totalBonusPoints + totalAdditionalScores;

    res.json({
      studentInfo,
      month,
      summary: {
        totalAttendancePoints,
        totalBonusPoints,
        totalAdditionalScores,
        detailedScores, // Esto muestra puntos por ROPA_TRABAJO, PARTICIPACION, etc.
        grandTotalPoints,
      },
      // También podríamos devolver los registros individuales si fuera necesario para un desglose más detallado en el frontend.
    });

  } catch (err) {
    console.error('Error en GET /api/reports/student-summary:', err);
    res.status(500).json({ message: 'Error interno del servidor al generar el resumen del estudiante.' });
  } finally {
    if (client) client.release();
  }
});

/**
 * @route   GET /api/reports/daily-summary
 * @desc    Obtener resumen de puntos de todos los estudiantes para un día específico.
 * @access  Private (Teacher)
 * @query   date=YYYY-MM-DD
 */
router.get('/daily-summary', async (req, res) => {
  const { date } = req.query; // date en formato YYYY-MM-DD

  if (!date) {
    return res.status(400).json({ message: 'date (YYYY-MM-DD) es requerido.' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ message: 'El formato de date debe ser YYYY-MM-DD.' });
  }

  const client = await pool.connect();
  try {
    // Usaremos CTEs (Common Table Expressions) para organizar las sumas de puntos por estudiante
    const summaryQuery = `
      WITH student_attendance_points AS (
        SELECT
          student_id,
          COALESCE(SUM(points_earned), 0) AS status_points,
          COALESCE(SUM(base_attendance_points), 0) AS presence_points
        FROM attendance_records
        WHERE attendance_date = $1
        GROUP BY student_id
      ), student_bonus_points AS (
        SELECT
          student_id,
          COALESCE(SUM(points_awarded), 0) AS bonus_points
        FROM daily_bonus_log
        WHERE bonus_date = $1
        GROUP BY student_id
      ), student_score_records_points AS (
        SELECT
          student_id,
          score_type,
          COALESCE(SUM(points_assigned), 0) AS score_points
        FROM score_records
        WHERE score_date = $1
        GROUP BY student_id, score_type
      ), aggregated_score_points AS (
        SELECT
          student_id,
          COALESCE(SUM(score_points),0) as total_additional_scores,
          jsonb_object_agg(score_type, score_points) FILTER (WHERE score_type IS NOT NULL) AS detailed_scores
        FROM student_score_records_points
        GROUP BY student_id
      )
      SELECT
        s.id AS student_id,
        s.full_name,
        s.nickname,
        COALESCE(sap.status_points, 0) + COALESCE(sap.presence_points, 0) AS total_attendance_points,
        COALESCE(sbp.bonus_points, 0) AS total_bonus_points,
        COALESCE(asp.total_additional_scores, 0) AS total_additional_scores,
        asp.detailed_scores,
        (COALESCE(sap.status_points, 0) + COALESCE(sap.presence_points, 0) +
         COALESCE(sbp.bonus_points, 0) +
         COALESCE(asp.total_additional_scores, 0)) AS grand_total_points
      FROM students s
      LEFT JOIN student_attendance_points sap ON s.id = sap.student_id
      LEFT JOIN student_bonus_points sbp ON s.id = sbp.student_id
      LEFT JOIN aggregated_score_points asp ON s.id = asp.student_id
      WHERE s.is_active = true -- Añadido para incluir solo estudiantes activos
      ORDER BY s.full_name;
    `;

    const summaryResult = await client.query(summaryQuery, [date]);

    res.json({
      date,
      dailySummary: summaryResult.rows,
    });

  } catch (err) {
    console.error('Error en GET /api/reports/daily-summary:', err);
    res.status(500).json({ message: 'Error interno del servidor al generar el resumen diario.' });
  } finally {
    if (client) client.release();
  }
});

/**
 * @route   GET /api/reports/monthly-ranking
 * @desc    Obtener el ranking de estudiantes para un mes específico, aplicando bono a los top 10 del mes anterior.
 * @access  Private (Teacher)
 * @query   month=YYYY-MM
 */
router.get('/monthly-ranking', async (req, res) => {
  const { month } = req.query; // month en formato YYYY-MM

  if (!month) {
    return res.status(400).json({ message: 'month (YYYY-MM) es requerido.' });
  }
  if (!/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ message: 'El formato de month debe ser YYYY-MM.' });
  }

  let client;
  try {
    client = await pool.connect();

    // 1. Determinar el mes anterior
    const [currentYear, currentMonthNum] = month.split('-').map(Number);
    let prevYear = currentYear;
    let prevMonthNum = currentMonthNum - 1;
    if (prevMonthNum === 0) {
      prevMonthNum = 12;
      prevYear = currentYear - 1;
    }
    const prevMonthString = `${prevYear}-${String(prevMonthNum).padStart(2, '0')}`;

    // 2. Obtener el Top 10 del mes anterior
    let top10PreviousMonthIDs = [];
    // Solo intentar obtener el top 10 si el mes anterior no es antes de un punto de inicio razonable (ej. inicio del sistema)
    // Por simplicidad, si es el primer mes de datos, no habrá bono.
    // Una lógica más robusta podría verificar si hay datos para prevMonthString.
    if (!(currentYear === prevYear && currentMonthNum === prevMonthNum)) { // Evita calcular para el mismo mes si algo va mal
        const prevRankingQuery = `
            WITH student_attendance_points_prev AS (
              SELECT
                student_id,
                COALESCE(SUM(points_earned), 0) AS status_points,
                COALESCE(SUM(base_attendance_points), 0) AS presence_points
              FROM attendance_records
              WHERE TO_CHAR(attendance_date, 'YYYY-MM') = $1
              GROUP BY student_id
            ), student_bonus_points_prev AS (
              SELECT
                student_id,
                COALESCE(SUM(points_awarded), 0) AS bonus_points
              FROM daily_bonus_log
              WHERE TO_CHAR(bonus_date, 'YYYY-MM') = $1
              GROUP BY student_id
            ), student_score_records_points_prev AS (
              SELECT
                student_id,
                COALESCE(SUM(points_assigned), 0) AS total_score_points
              FROM score_records
              WHERE TO_CHAR(score_date, 'YYYY-MM') = $1
              GROUP BY student_id
            )
            SELECT
              s.id AS student_id,
              (COALESCE(sap.status_points, 0) + COALESCE(sap.presence_points, 0) +
               COALESCE(sbp.bonus_points, 0) +
               COALESCE(ssrp.total_score_points, 0)) AS grand_total_points
            FROM students s
            LEFT JOIN student_attendance_points_prev sap ON s.id = sap.student_id
            LEFT JOIN student_bonus_points_prev sbp ON s.id = sbp.student_id
            LEFT JOIN student_score_records_points_prev ssrp ON s.id = ssrp.student_id
            WHERE s.is_active = true
            ORDER BY grand_total_points DESC, s.full_name ASC
            LIMIT 10;
        `;
        const prevRankingResult = await client.query(prevRankingQuery, [prevMonthString]);
        // Solo asignar IDs para el bono si hay resultados y el puntaje máximo del mes anterior es > 0
        if (prevRankingResult.rows.length > 0 && prevRankingResult.rows[0].grand_total_points > 0) {
            top10PreviousMonthIDs = prevRankingResult.rows.map(r => r.student_id);
        }
        // Si no, top10PreviousMonthIDs permanece vacío, y no se aplicará bono.
    }


    // 3. Calcular el ranking del mes actual, aplicando el bono
    const currentRankingQuery = `
      WITH student_attendance_points AS (
        SELECT
          student_id,
          COALESCE(SUM(points_earned), 0) AS status_points,
          COALESCE(SUM(base_attendance_points), 0) AS presence_points
        FROM attendance_records
        WHERE TO_CHAR(attendance_date, 'YYYY-MM') = $1 -- Mes actual
        GROUP BY student_id
      ), student_bonus_points AS (
        SELECT
          student_id,
          COALESCE(SUM(points_awarded), 0) AS bonus_points
        FROM daily_bonus_log
        WHERE TO_CHAR(bonus_date, 'YYYY-MM') = $1 -- Mes actual
        GROUP BY student_id
      ), student_score_records_points AS (
        SELECT
          student_id,
          COALESCE(SUM(points_assigned), 0) AS total_score_points
        FROM score_records
        WHERE TO_CHAR(score_date, 'YYYY-MM') = $1 -- Mes actual
        GROUP BY student_id
      )
      SELECT
        s.id AS student_id,
        s.full_name,
        s.nickname,
        (COALESCE(sap.status_points, 0) + COALESCE(sap.presence_points, 0) +
         COALESCE(sbp.bonus_points, 0) +
         COALESCE(ssrp.total_score_points, 0) +
         CASE
           WHEN s.id = ANY($2::VARCHAR[]) THEN 15 -- $2 es el array de IDs del top 10 anterior
           ELSE 0
         END
        ) AS grand_total_points,
        COALESCE(sap.status_points, 0) + COALESCE(sap.presence_points, 0) AS total_attendance_points,
        COALESCE(sbp.bonus_points, 0) AS total_bonus_points,
        COALESCE(ssrp.total_score_points, 0) AS total_additional_scores,
        CASE
          WHEN s.id = ANY($2::VARCHAR[]) THEN 15
          ELSE 0
        END AS bonus_from_previous_month_rank
      FROM students s
      LEFT JOIN student_attendance_points sap ON s.id = sap.student_id
      LEFT JOIN student_bonus_points sbp ON s.id = sbp.student_id
      LEFT JOIN student_score_records_points ssrp ON s.id = ssrp.student_id
      WHERE s.is_active = true
      ORDER BY grand_total_points DESC, s.full_name ASC;
    `;

    const currentRankingResult = await client.query(currentRankingQuery, [month, top10PreviousMonthIDs]);

    res.json({
      month,
      ranking: currentRankingResult.rows,
      appliedBonusTo: top10PreviousMonthIDs, // Para depuración o información en el frontend
    });

  } catch (err) {
    console.error('Error en GET /api/reports/monthly-ranking:', err);
    res.status(500).json({ message: 'Error interno del servidor al generar el ranking mensual.' });
  } finally {
    if (client) client.release();
  }
});

module.exports = router;
