const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// El authMiddleware se aplicará globalmente a estas rutas en server.js

// Umbrales para el Estado de Acceso a Casting (actualizados)
const CASTING_THRESHOLDS = {
  APTO_MIN_POINTS: 50,
  EN_EVALUACION_MIN_POINTS: 30,
  // NO_APTO es implícito si es menor que EN_EVALUACION_MIN_POINTS
};

const determineCastingStatus = (totalPoints) => {
  if (totalPoints >= CASTING_THRESHOLDS.APTO_MIN_POINTS) { // 50 o más
    return 'APTO';
  } else if (totalPoints >= CASTING_THRESHOLDS.EN_EVALUACION_MIN_POINTS) { // 30 a 49
    return 'EN EVALUACIÓN';
  } else { // Menos de 30
    return 'NO APTO';
  }
};

/**
 * @route   GET /api/student/dashboard-data
 * @desc    Obtener datos para el dashboard del estudiante (info, puntaje mensual, estado casting)
 * @access  Private (Student)
 */
router.get('/dashboard-data', async (req, res) => {
  // El studentId se extrae del token JWT verificado por authMiddleware
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado: No es un estudiante autenticado.' });
  }
  const studentId = req.user.id;

  // Obtener el mes actual en formato YYYY-MM para las consultas de puntos
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const client = await pool.connect();
  try {
    // 1. Información del estudiante
    const studentInfoQuery = 'SELECT id, full_name, nickname FROM students WHERE id = $1';
    // En el futuro, añadir photo_url: 'SELECT id, full_name, nickname, photo_url FROM students WHERE id = $1';
    const studentInfoResult = await client.query(studentInfoQuery, [studentId]);

    if (studentInfoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    const studentInfo = studentInfoResult.rows[0];
    // Simular photo_url por ahora
    studentInfo.photo_url = `https://via.placeholder.com/150?text=${studentInfo.nickname || studentInfo.id}`;


    // 2. Calcular puntaje total del mes actual (similar a la lógica de /monthly-ranking)
    // (Esta lógica podría refactorizarse en una función helper si se usa en múltiples lugares)
    const attendancePointsQuery = `
      SELECT COALESCE(SUM(points_earned), 0) AS status_points, COALESCE(SUM(base_attendance_points), 0) AS presence_points
      FROM attendance_records WHERE student_id = $1 AND TO_CHAR(attendance_date, 'YYYY-MM') = $2;`;
    const bonusPointsQuery = `
      SELECT COALESCE(SUM(points_awarded), 0) AS total_bonus
      FROM daily_bonus_log WHERE student_id = $1 AND TO_CHAR(bonus_date, 'YYYY-MM') = $2;`;
    const scoresQuery = `
      SELECT COALESCE(SUM(points_assigned), 0) AS total_score_points
      FROM score_records WHERE student_id = $1 AND TO_CHAR(score_date, 'YYYY-MM') = $2;`;

    const [attPointsRes, bonusPointsRes, scoresRes] = await Promise.all([
      client.query(attendancePointsQuery, [studentId, currentMonth]),
      client.query(bonusPointsQuery, [studentId, currentMonth]),
      client.query(scoresQuery, [studentId, currentMonth]),
    ]);

    const totalAttendancePoints = parseInt(attPointsRes.rows[0]?.status_points || 0, 10) + parseInt(attPointsRes.rows[0]?.presence_points || 0, 10);
    const totalBonusPoints = parseInt(bonusPointsRes.rows[0]?.total_bonus || 0, 10);
    const totalAdditionalScores = parseInt(scoresRes.rows[0]?.total_score_points || 0, 10);
    const monthlyTotalPoints = totalAttendancePoints + totalBonusPoints + totalAdditionalScores;

    // 3. Determinar Estado de Acceso a Casting
    const castingStatus = determineCastingStatus(monthlyTotalPoints);

    // (Opcional) Obtener posición en el ranking del mes actual
    // Esta consulta es más compleja, la omitiré por ahora para simplificar,
    // pero se podría añadir si es un requisito fuerte para el dashboard del estudiante.
    // El estudiante podría ir a la página de Ranking general si desea ver su posición.

    // 4. Calcular posición en el ranking mensual
    //    Reutiliza la lógica de /api/reports/monthly-ranking pero solo para obtener la posición del estudiante actual.
    const rankingQuery = `
      WITH student_monthly_scores AS (
        SELECT
          s.id AS student_id,
          (COALESCE(SUM(ar.points_earned + ar.base_attendance_points), 0) +
           COALESCE(SUM(dbl.points_awarded), 0) +
           COALESCE(SUM(sr.points_assigned), 0)) AS total_points
        FROM students s
        LEFT JOIN attendance_records ar ON s.id = ar.student_id AND TO_CHAR(ar.attendance_date, 'YYYY-MM') = $2
        LEFT JOIN daily_bonus_log dbl ON s.id = dbl.student_id AND TO_CHAR(dbl.bonus_date, 'YYYY-MM') = $2
        LEFT JOIN score_records sr ON s.id = sr.student_id AND TO_CHAR(sr.score_date, 'YYYY-MM') = $2
        GROUP BY s.id
      ), ranked_students AS (
        SELECT
          student_id,
          total_points,
          RANK() OVER (ORDER BY total_points DESC) as rank_position
        FROM student_monthly_scores
      )
      SELECT rank_position FROM ranked_students WHERE student_id = $1;
    `;
    // Nota: Esta consulta de ranking puede ser pesada. Para optimizar, se podría tener una tabla de ranking precalculada y actualizada periódicamente.
    // O, si el número de estudiantes no es masivo, puede ser aceptable.

    let rankingPosition = null;
    try {
        const rankingResult = await client.query(rankingQuery, [studentId, currentMonth]);
        if (rankingResult.rows.length > 0) {
            rankingPosition = parseInt(rankingResult.rows[0].rank_position, 10);
        }
    } catch (rankErr) {
        console.error("Error calculating student ranking position:", rankErr);
        // No hacer que falle toda la solicitud si el ranking falla, pero loguear el error.
        rankingPosition = null;
    }


    res.json({
      studentInfo,
      currentMonth,
      monthlyTotalPoints,
      castingStatus,
      rankingPosition,
    });

  } catch (err) {
    console.error('Error en GET /api/student/dashboard-data:', err);
    res.status(500).json({ message: 'Error interno del servidor al obtener datos del dashboard.' });
  } finally {
    client.release();
  }
});


/**
 * @route   GET /api/student/my-scores-summary
 * @desc    Obtener desglose de puntajes para el estudiante autenticado (diario o mensual)
 * @access  Private (Student)
 * @query   type=<daily|monthly>, date=<YYYY-MM-DD o YYYY-MM>
 */
router.get('/my-scores-summary', async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const studentId = req.user.id;
  const { type, date } = req.query;

  if (!type || !date) {
    return res.status(400).json({ message: 'Los parámetros type (daily/monthly) y date son requeridos.' });
  }

  let detailedRecords = [];
  const client = await pool.connect();

  try {
    if (type === 'daily') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Para type=daily, el formato de date debe ser YYYY-MM-DD.' });
      }
      // Consulta para registros de asistencia del día
      const attendanceRes = await client.query(
        `SELECT 'Asistencia' as record_type, status as description, (points_earned + base_attendance_points) as points, notes, recorded_at
         FROM attendance_records WHERE student_id = $1 AND attendance_date = $2`,
        [studentId, date]
      );
      detailedRecords.push(...attendanceRes.rows.map(r => ({...r, source: 'attendance'})));

      // Consulta para bono del día
      const bonusRes = await client.query(
        `SELECT 'Bono Madrugador' as record_type, 'Bono Otorgado' as description, points_awarded as points, NULL as notes, awarded_at as recorded_at
         FROM daily_bonus_log WHERE student_id = $1 AND bonus_date = $2`,
        [studentId, date]
      );
      detailedRecords.push(...bonusRes.rows.map(r => ({...r, source: 'bonus'})));

      // Consulta para scores adicionales del día
      const scoresRes = await client.query(
        `SELECT score_type as record_type, COALESCE(sub_category, score_type) as description, points_assigned as points, notes, recorded_at
         FROM score_records WHERE student_id = $1 AND score_date = $2`,
        [studentId, date]
      );
      detailedRecords.push(...scoresRes.rows.map(r => ({...r, source: 'score'})));

    } else if (type === 'monthly') {
      if (!/^\d{4}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Para type=monthly, el formato de date debe ser YYYY-MM.' });
      }
      // Consulta para registros de asistencia del mes
       const attendanceRes = await client.query(
        `SELECT attendance_date, 'Asistencia' as record_type, status as description, (points_earned + base_attendance_points) as points, notes, recorded_at
         FROM attendance_records WHERE student_id = $1 AND TO_CHAR(attendance_date, 'YYYY-MM') = $2 ORDER BY attendance_date, recorded_at`,
        [studentId, date]
      );
      detailedRecords.push(...attendanceRes.rows.map(r => ({...r, source: 'attendance'})));

      // Consulta para bono del mes
      const bonusRes = await client.query(
        `SELECT bonus_date as attendance_date, 'Bono Madrugador' as record_type, 'Bono Otorgado' as description, points_awarded as points, NULL as notes, awarded_at as recorded_at
         FROM daily_bonus_log WHERE student_id = $1 AND TO_CHAR(bonus_date, 'YYYY-MM') = $2 ORDER BY bonus_date, recorded_at`,
        [studentId, date]
      );
      detailedRecords.push(...bonusRes.rows.map(r => ({...r, source: 'bonus'})));

      // Consulta para scores adicionales del mes
      const scoresRes = await client.query(
        `SELECT score_date as attendance_date, score_type as record_type, COALESCE(sub_category, score_type) as description, points_assigned as points, notes, recorded_at
         FROM score_records WHERE student_id = $1 AND TO_CHAR(score_date, 'YYYY-MM') = $2 ORDER BY score_date, recorded_at`,
        [studentId, date]
      );
      detailedRecords.push(...scoresRes.rows.map(r => ({...r, source: 'score'})));

      // Ordenar todos los registros por fecha y luego por hora de registro para una vista cronológica
      detailedRecords.sort((a,b) => new Date(a.attendance_date || a.recorded_at) - new Date(b.attendance_date || b.recorded_at) || new Date(a.recorded_at) - new Date(b.recorded_at));

    } else {
      return res.status(400).json({ message: 'El parámetro type debe ser "daily" o "monthly".' });
    }

    res.json({
      studentId,
      queryType: type,
      queryDate: date,
      records: detailedRecords,
    });

  } catch (err) {
    console.error(`Error en GET /api/student/my-scores-summary (type: ${type}, date: ${date}):`, err);
    res.status(500).json({ message: 'Error interno del servidor al obtener el detalle de puntajes.' });
  } finally {
    client.release();
  }
});


module.exports = router;
