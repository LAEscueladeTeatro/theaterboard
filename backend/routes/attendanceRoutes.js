const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Constantes para los puntos (para mantener la consistencia)
const POINTS = {
  PUNTUAL: 2,
  A_TIEMPO: 1,
  TARDANZA_JUSTIFICADA: -1,
  TARDANZA_INJUSTIFICADA: -2,
  AUSENCIA_JUSTIFICADA: -1,
  AUSENCIA_INJUSTIFICADA: -3,
  BASE_ASISTENCIA: 2, // +2 adicional por asistir (puntual, a tiempo, tardanza)
  BONO_MADRUGADOR: 3,
};

// Constantes para los estados de asistencia
const STATUS = {
  PUNTUAL: 'PUNTUAL',
  A_TIEMPO: 'A_TIEMPO',
  TARDANZA_JUSTIFICADA: 'TARDANZA_JUSTIFICADA',
  TARDANZA_INJUSTIFICADA: 'TARDANZA_INJUSTIFICADA',
  AUSENCIA_JUSTIFICADA: 'AUSENCIA_JUSTIFICADA',
  AUSENCIA_INJUSTIFICADA: 'AUSENCIA_INJUSTIFICADA',
};

/**
 * @route   POST /api/attendance/record
 * @desc    Registrar la asistencia de un estudiante (puntual, a tiempo, tardanza)
 * @access  Private (Teacher)
 */
router.post('/record', authMiddleware, async (req, res) => {
  const { student_id, attendance_date, status, notes } = req.body; // attendance_date en formato 'YYYY-MM-DD'

  // Validación básica de entrada
  if (!student_id || !attendance_date || !status) {
    return res.status(400).json({ message: 'student_id, attendance_date y status son requeridos.' });
  }

  if (!Object.values(STATUS).includes(status)) {
    return res.status(400).json({ message: 'Valor de status no válido.' });
  }

  // No permitir registrar AUSENCIA directamente aquí, se maneja en /close
  if (status === STATUS.AUSENCIA_JUSTIFICADA || status === STATUS.AUSENCIA_INJUSTIFICADA) {
    return res.status(400).json({ message: 'Las ausencias se registran a través del endpoint de cierre de asistencia.' });
  }

  let points_earned = 0;
  let base_attendance_points = POINTS.BASE_ASISTENCIA; // Por defecto, si asiste, gana +2

  switch (status) {
    case STATUS.PUNTUAL:
      points_earned = POINTS.PUNTUAL;
      break;
    case STATUS.A_TIEMPO:
      points_earned = POINTS.A_TIEMPO;
      break;
    case STATUS.TARDANZA_JUSTIFICADA:
      points_earned = POINTS.TARDANZA_JUSTIFICADA;
      break;
    case STATUS.TARDANZA_INJUSTIFICADA:
      points_earned = POINTS.TARDANZA_INJUSTIFICADA;
      break;
    default:
      // Esto no debería ocurrir si la validación de status es correcta
      return res.status(400).json({ message: 'Status de asistencia no reconocido para cálculo de puntos.' });
  }

  try {
    const client = await pool.connect();
    try {
      // Verificar si ya existe un registro para este estudiante en esta fecha
      // La constraint unique_student_attendance_per_day manejará esto, pero es bueno verificarlo programáticamente también
      // para dar un mensaje más amigable o permitir la actualización (UPSERT).
      // Por ahora, usaremos INSERT ... ON CONFLICT para actualizar si ya existe.

      const query = `
        INSERT INTO attendance_records (student_id, attendance_date, status, points_earned, base_attendance_points, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (student_id, attendance_date)
        DO UPDATE SET
          status = EXCLUDED.status,
          points_earned = EXCLUDED.points_earned,
          base_attendance_points = EXCLUDED.base_attendance_points,
          notes = EXCLUDED.notes,
          recorded_at = CURRENT_TIMESTAMP
        RETURNING *;
      `;
      const values = [student_id, attendance_date, status, points_earned, base_attendance_points, notes || null];
      const result = await client.query(query, values);

      res.status(201).json({ message: 'Registro de asistencia guardado.', record: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en POST /api/attendance/record:', err);
    if (err.code === '23503') { // foreign key violation
        return res.status(400).json({ message: 'Error: student_id no existe.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al guardar el registro de asistencia.' });
  }
});

/**
 * @route   POST /api/attendance/early-bonus
 * @desc    Aplicar el bono madrugador a un estudiante
 * @access  Private (Teacher)
 */
router.post('/early-bonus', authMiddleware, async (req, res) => {
  const { student_id, bonus_date } = req.body; // bonus_date en formato 'YYYY-MM-DD'

  if (!student_id || !bonus_date) {
    return res.status(400).json({ message: 'student_id y bonus_date son requeridos.' });
  }

  try {
    const client = await pool.connect();
    try {
      // Primero, verificar que el estudiante haya asistido ese día.
      // No se puede dar bono a alguien que no vino o cuya asistencia aún no se registra.
      // (Esta verificación es opcional según la lógica de negocio, pero parece razonable)
      const attendanceCheck = await client.query(
        "SELECT id FROM attendance_records WHERE student_id = $1 AND attendance_date = $2 AND status NOT LIKE 'AUSENCIA%'",
        [student_id, bonus_date]
      );

      if (attendanceCheck.rows.length === 0) {
        return res.status(400).json({ message: 'No se puede aplicar bono: el estudiante no tiene un registro de asistencia válido para esta fecha o está marcado como ausente.' });
      }

      // Intentar insertar el bono. La constraint unique_bonus_per_day se encargará de la unicidad.
      const bonusQuery = `
        INSERT INTO daily_bonus_log (student_id, bonus_date, points_awarded)
        VALUES ($1, $2, $3)
        RETURNING *;
      `;
      const bonusValues = [student_id, bonus_date, POINTS.BONO_MADRUGADOR];
      const result = await client.query(bonusQuery, bonusValues);

      res.status(201).json({ message: 'Bono madrugador aplicado exitosamente.', bonus_record: result.rows[0] });
    } catch (dbErr) {
      if (dbErr.code === '23505' && dbErr.constraint === 'unique_bonus_per_day') {
        // Error de violación de unicidad para el bono del día
        return res.status(409).json({ message: 'Error: El bono madrugador para esta fecha ya ha sido otorgado.' });
      }
      if (dbErr.code === '23503') { // foreign key violation
        return res.status(400).json({ message: 'Error: student_id no existe.' });
      }
      // Otros errores de base de datos
      console.error('Error en POST /api/attendance/early-bonus (DB):', dbErr);
      res.status(500).json({ message: 'Error interno del servidor al aplicar el bono.' });
    }
    finally {
      client.release();
    }
  } catch (err) {
    // Errores al conectar al pool, etc.
    console.error('Error en POST /api/attendance/early-bonus (General):', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

/**
 * @route   POST /api/attendance/close
 * @desc    Cierra la asistencia del día: marca a los no registrados como ausentes.
 * @access  Private (Teacher)
 */
router.post('/close', authMiddleware, async (req, res) => {
  const { attendance_date, absent_students_justifications } = req.body;
  // absent_students_justifications: array de objetos [{ student_id: "ET0XX", is_justified: true, notes: "Médico" }, ...]

  if (!attendance_date) {
    return res.status(400).json({ message: 'attendance_date es requerida.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciar transacción

    // 1. Obtener todos los IDs de estudiantes activos
    const allStudentsResult = await client.query('SELECT id FROM students'); // Asumimos que todos los estudiantes en la tabla son 'activos' para la asistencia
    const allStudentIds = allStudentsResult.rows.map(s => s.id);

    // 2. Obtener IDs de estudiantes que YA tienen un registro de asistencia para esa fecha
    const alreadyRecordedResult = await client.query(
      'SELECT student_id FROM attendance_records WHERE attendance_date = $1',
      [attendance_date]
    );
    const recordedStudentIds = new Set(alreadyRecordedResult.rows.map(r => r.student_id));

    // 3. Determinar estudiantes que faltan por registrar (ausentes)
    const absentStudentIds = allStudentIds.filter(id => !recordedStudentIds.has(id));

    if (absentStudentIds.length === 0 && (!absent_students_justifications || absent_students_justifications.length === 0)) {
      await client.query('COMMIT');
      return res.status(200).json({ message: 'Todos los estudiantes ya tienen un registro de asistencia para esta fecha. No se realizaron cambios.' });
    }

    const recordsToInsert = [];
    const justificationsMap = new Map(
      (absent_students_justifications || []).map(j => [j.student_id, { is_justified: j.is_justified, notes: j.notes }])
    );

    for (const student_id of absentStudentIds) {
      const justification = justificationsMap.get(student_id);
      let status, points_earned, notes = null;

      if (justification) {
        status = justification.is_justified ? STATUS.AUSENCIA_JUSTIFICADA : STATUS.AUSENCIA_INJUSTIFICADA;
        points_earned = justification.is_justified ? POINTS.AUSENCIA_JUSTIFICADA : POINTS.AUSENCIA_INJUSTIFICADA;
        notes = justification.notes;
      } else {
        // Si no está en la lista de justificaciones, se asume AUSENCIA_INJUSTIFICADA por defecto
        status = STATUS.AUSENCIA_INJUSTIFICADA;
        points_earned = POINTS.AUSENCIA_INJUSTIFICADA;
      }

      // Para ausencias, base_attendance_points es 0
      recordsToInsert.push({ student_id, attendance_date, status, points_earned, base_attendance_points: 0, notes });
    }

    let insertedCount = 0;
    if (recordsToInsert.length > 0) {
      // Usar un bucle para insertar uno por uno para manejar conflictos individuales si es necesario,
      // o construir una consulta multi-valores (más eficiente pero más compleja para ON CONFLICT individual)
      // Por simplicidad y dado que estos son nuevos registros (no deberían haber conflictos si la lógica es correcta),
      // una inserción simple por cada uno.
      for (const record of recordsToInsert) {
        const insertQuery = `
          INSERT INTO attendance_records (student_id, attendance_date, status, points_earned, base_attendance_points, notes)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (student_id, attendance_date) DO NOTHING;
          -- DO NOTHING porque si ya existe, fue marcado antes (no debería ser ausencia)
        `;
        const result = await client.query(insertQuery, [record.student_id, record.attendance_date, record.status, record.points_earned, record.base_attendance_points, record.notes]);
        if (result.rowCount > 0) {
            insertedCount++;
        }
      }
    }

    await client.query('COMMIT'); // Finalizar transacción
    res.status(200).json({ message: `Cierre de asistencia completado. ${insertedCount} estudiantes marcados como ausentes.` });

  } catch (err) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    console.error('Error en POST /api/attendance/close:', err);
    res.status(500).json({ message: 'Error interno del servidor al cerrar la asistencia.' });
  } finally {
    client.release();
  }
});

/**
 * @route   GET /api/attendance/status/:date
 * @desc    Obtener todos los registros de asistencia y el bono para una fecha específica
 * @access  Private (Teacher)
 */
router.get('/status/:date', authMiddleware, async (req, res) => {
  const { date } = req.params; // Fecha en formato 'YYYY-MM-DD'

  if (!date) {
    return res.status(400).json({ message: 'El parámetro de fecha es requerido.' });
  }

  try {
    const client = await pool.connect();
    try {
      // Obtener registros de asistencia
      const attendanceResult = await client.query(
        `SELECT ar.student_id, s.full_name, s.nickname, ar.status, ar.points_earned, ar.base_attendance_points, ar.notes, ar.recorded_at
         FROM attendance_records ar
         JOIN students s ON ar.student_id = s.id
         WHERE ar.attendance_date = $1
         ORDER BY s.full_name`,
        [date]
      );

      // Obtener el bono madrugador si existe para esa fecha
      const bonusResult = await client.query(
        `SELECT dbl.student_id, s.full_name AS bonus_student_name, dbl.points_awarded
         FROM daily_bonus_log dbl
         JOIN students s ON dbl.student_id = s.id
         WHERE dbl.bonus_date = $1`,
        [date]
      );

      res.json({
        attendance_records: attendanceResult.rows,
        bonus_awarded_today: bonusResult.rows.length > 0 ? bonusResult.rows[0] : null,
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error(`Error en GET /api/attendance/status/${date}:`, err);
    res.status(500).json({ message: 'Error interno del servidor al obtener el estado de la asistencia.' });
  }
});

module.exports = router;
