const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// El authMiddleware se aplicará globalmente a estas rutas en server.js

// Umbrales para el Estado de Acceso a Casting (ejemplo)
const CASTING_THRESHOLDS = {
  APTO_MIN_POINTS: 100,
  EN_EVALUACION_MIN_POINTS: 50,
};

const determineCastingStatus = (totalPoints) => {
  if (totalPoints >= CASTING_THRESHOLDS.APTO_MIN_POINTS) {
    return 'APTO';
  } else if (totalPoints >= CASTING_THRESHOLDS.EN_EVALUACION_MIN_POINTS) {
    return 'EN EVALUACIÓN';
  } else {
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

    res.json({
      studentInfo,
      currentMonth,
      monthlyTotalPoints,
      castingStatus,
      // rankingPosition: null, // Placeholder
    });

  } catch (err) {
    console.error('Error en GET /api/student/dashboard-data:', err);
    res.status(500).json({ message: 'Error interno del servidor al obtener datos del dashboard.' });
  } finally {
    client.release();
  }
});

module.exports = router;
