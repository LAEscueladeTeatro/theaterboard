const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// authMiddleware se aplicará a nivel de app.use() en server.js para todas las rutas de scores

// Constantes para tipos de puntuación (para consistencia con el frontend y la lógica)
const SCORE_TYPES = {
  ROPA_TRABAJO: 'ROPA_TRABAJO',     // Uso único diario
  MATERIALES: 'MATERIALES',         // Acumulativo
  LIMPIEZA: 'LIMPIEZA',             // Uso único diario
  PARTICIPACION: 'PARTICIPACION',   // Acumulativo
  CONDUCTA: 'CONDUCTA',             // Acumulativo
  USO_CELULAR: 'USO_CELULAR',       // Acumulativo
  CINCO_VALIENTES: 'CINCO_VALIENTES', // Uso único diario
  PRIMER_GRUPO: 'PRIMER_GRUPO',       // Uso único diario
  EXTRA: 'EXTRA',                   // Acumulativo (Personal)
};

// Tipos de score que son de uso único diario (el mismo tipo de score no se puede aplicar dos veces en el mismo día a ningún estudiante)
const SINGLE_USE_PER_DAY_TYPES = [
  SCORE_TYPES.ROPA_TRABAJO,
  SCORE_TYPES.LIMPIEZA,
  SCORE_TYPES.CINCO_VALIENTES,
  SCORE_TYPES.PRIMER_GRUPO,
];

// Puntos por defecto
const DEFAULT_POINTS = {
  COMPLIANT: 1,           // Para ROPA_TRABAJO, MATERIALES, LIMPIEZA (si cumple)
  NON_COMPLIANT: -1,      // Para ROPA_TRABAJO, MATERIALES, LIMPIEZA (si no cumple)
  CINCO_VALIENTES: 1,     // +1 para cada uno de los cinco valientes
  PRIMER_GRUPO: 1,        // +1 para cada miembro del primer grupo
  PARTICIPACION_ACTIVA: 2,
  PARTICIPACION_APATICA: -1,
  CONDUCTA_LEVE: -1,
  CONDUCTA_MEDIA: -2,
  CONDUCTA_GRAVE: -3,
  USO_CELULAR_ADVERTENCIA: -1,
  USO_CELULAR_REITERADO: -3,
};

/**
 * @route   POST /api/scores/group
 * @desc    Registrar puntuaciones grupales (Ropa de trabajo, Materiales, Limpieza)
 * @access  Private (Teacher)
 * @body    { score_type: "ROPA_TRABAJO" | "MATERIALES" | "LIMPIEZA",
 *            score_date: "YYYY-MM-DD",
 *            students_compliant: ["ET001", "ET002"],
 *            students_non_compliant: ["ET003"] }
 */
router.post('/group', async (req, res) => {
  // Desestructurar todas las posibles variables del body una sola vez
  const { score_type, score_date, students_compliant = [], students_non_compliant = [], student_ids = [] } = req.body;
  // student_ids se usará para CINCO_VALIENTES y PRIMER_GRUPO

  // Validación de entrada
  if (!score_type || !score_date) {
    return res.status(400).json({ message: 'score_type y score_date son requeridos.' });
  }
  const validGroupTypes = [
    SCORE_TYPES.ROPA_TRABAJO, SCORE_TYPES.MATERIALES, SCORE_TYPES.LIMPIEZA,
    SCORE_TYPES.CINCO_VALIENTES, SCORE_TYPES.PRIMER_GRUPO
  ];
  if (!validGroupTypes.includes(score_type)) {
    return res.status(400).json({ message: 'score_type no es válido para este endpoint.' });
  }

  const client = await pool.connect();
  try {
    // Validación de uso único diario para tipos aplicables
    if (SINGLE_USE_PER_DAY_TYPES.includes(score_type)) {
      const checkQuery = await client.query(
        'SELECT id FROM score_records WHERE score_type = $1 AND score_date = $2 LIMIT 1',
        [score_type, score_date]
      );
      if (checkQuery.rows.length > 0) {
        client.release();
        return res.status(409).json({ message: `El tipo de puntuación '${score_type}' ya ha sido registrado hoy.` });
      }
    }

    // Validación específica para CINCO_VALIENTES
    if (score_type === SCORE_TYPES.CINCO_VALIENTES) {
      if (!Array.isArray(student_ids) || student_ids.length === 0) {
        client.release();
        return res.status(400).json({ message: 'Se requiere un array de student_ids para CINCO_VALIENTES.' });
      }
      if (student_ids.length > 5) {
        client.release();
        return res.status(400).json({ message: 'CINCO_VALIENTES solo puede tener hasta 5 estudiantes.' });
      }
    } else if (score_type === SCORE_TYPES.PRIMER_GRUPO) {
       if (!Array.isArray(student_ids) || student_ids.length === 0) {
        client.release();
        return res.status(400).json({ message: 'Se requiere un array de student_ids para PRIMER_GRUPO.' });
      }
    } else { // ROPA_TRABAJO, MATERIALES, LIMPIEZA
      if (!Array.isArray(students_compliant) || !Array.isArray(students_non_compliant)) {
        client.release();
        return res.status(400).json({ message: 'students_compliant y students_non_compliant deben ser arrays para este tipo.' });
      }
    }

    await client.query('BEGIN'); // Iniciar transacción
    const records = [];

    if (score_type === SCORE_TYPES.CINCO_VALIENTES || score_type === SCORE_TYPES.PRIMER_GRUPO) {
      const points = score_type === SCORE_TYPES.CINCO_VALIENTES ? DEFAULT_POINTS.CINCO_VALIENTES : DEFAULT_POINTS.PRIMER_GRUPO;
      for (const student_id of student_ids) {
        const result = await client.query(
          `INSERT INTO score_records (student_id, score_date, score_type, points_assigned)
           VALUES ($1, $2, $3, $4) RETURNING *`,
          [student_id, score_date, score_type, points]
        );
        records.push(result.rows[0]);
      }
    } else { // ROPA_TRABAJO, MATERIALES, LIMPIEZA
      for (const student_id of students_compliant) {
        const result = await client.query(
          `INSERT INTO score_records (student_id, score_date, score_type, sub_category, points_assigned)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [student_id, score_date, score_type, 'Cumple', DEFAULT_POINTS.COMPLIANT]
        );
        records.push(result.rows[0]);
      }
      for (const student_id of students_non_compliant) {
        const result = await client.query(
          `INSERT INTO score_records (student_id, score_date, score_type, sub_category, points_assigned)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [student_id, score_date, score_type, 'No Cumple', DEFAULT_POINTS.NON_COMPLIANT]
        );
        records.push(result.rows[0]);
      }
    }

    await client.query('COMMIT'); // Finalizar transacción
    res.status(201).json({ message: `Puntuaciones para ${score_type} registradas.`, count: records.length, records });

  } catch (err) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    console.error(`Error en POST /api/scores/group (${score_type}):`, err);
    if (err.code === '23503') { // foreign key violation
        return res.status(400).json({ message: 'Error: Uno o más student_id no existen.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al registrar puntuaciones grupales.' });
  } finally {
    client.release();
  }
});

/**
 * @route   POST /api/scores/personal
 * @desc    Registrar puntuaciones personales (Participación, Conducta, Uso de Celulares)
 * @access  Private (Teacher)
 * @body    { student_id: "ET001",
 *            score_type: "PARTICIPACION" | "CONDUCTA" | "USO_CELULAR",
 *            score_date: "YYYY-MM-DD",
 *            points_assigned: -2, // Para CONDUCTA y USO_CELULAR, este valor es directo. Para PARTICIPACION, se podría deducir.
 *            sub_category: "Apático" | "Falta Leve" | "Uso en clase", // Opcional, descriptivo
 *            notes: "Descripción detallada de la conducta." }
 */
router.post('/personal', async (req, res) => {
  const { student_id, score_type, score_date, points_assigned, sub_category, notes } = req.body;

  // Validación de entrada
  if (!student_id || !score_type || !score_date || (points_assigned === undefined && score_type !== SCORE_TYPES.PARTICIPACION /* Para participación se deduce */) ) {
    return res.status(400).json({ message: 'student_id, score_type, score_date son requeridos. points_assigned es requerido excepto para PARTICIPACION.' });
  }
  const validPersonalTypes = [
    SCORE_TYPES.PARTICIPACION, SCORE_TYPES.CONDUCTA,
    SCORE_TYPES.USO_CELULAR, SCORE_TYPES.EXTRA
  ];
  if (!validPersonalTypes.includes(score_type)) {
    return res.status(400).json({ message: 'score_type no es válido para puntuaciones personales.' });
  }
  if (score_type !== SCORE_TYPES.PARTICIPACION && typeof points_assigned !== 'number') {
    return res.status(400).json({ message: 'points_assigned debe ser un número para este tipo de score.' });
  }

  // Validación específica de puntos según el tipo (ejemplos)
  // Para EXTRA, no hay validación de puntos aquí, ya que puede ser cualquier valor.
  if (score_type === SCORE_TYPES.PARTICIPACION) {
    if (![DEFAULT_POINTS.PARTICIPACION_ACTIVA, DEFAULT_POINTS.PARTICIPACION_APATICA].includes(points_assigned)) {
        return res.status(400).json({ message: `Puntos para PARTICIPACION deben ser ${DEFAULT_POINTS.PARTICIPACION_ACTIVA} o ${DEFAULT_POINTS.PARTICIPACION_APATICA}.` });
    }
  } else if (score_type === SCORE_TYPES.CONDUCTA) {
    if (![DEFAULT_POINTS.CONDUCTA_GRAVE, DEFAULT_POINTS.CONDUCTA_MEDIA, DEFAULT_POINTS.CONDUCTA_LEVE].includes(points_assigned)) {
        return res.status(400).json({ message: `Puntos para CONDUCTA deben ser ${DEFAULT_POINTS.CONDUCTA_GRAVE}, ${DEFAULT_POINTS.CONDUCTA_MEDIA}, o ${DEFAULT_POINTS.CONDUCTA_LEVE}.` });
    }
  } else if (score_type === SCORE_TYPES.USO_CELULAR) {
    if (![DEFAULT_POINTS.USO_CELULAR_REITERADO, DEFAULT_POINTS.USO_CELULAR_ADVERTENCIA].includes(points_assigned)) {
        return res.status(400).json({ message: `Puntos para USO_CELULAR deben ser ${DEFAULT_POINTS.USO_CELULAR_REITERADO} o ${DEFAULT_POINTS.USO_CELULAR_ADVERTENCIA}.` });
    }
  }

  try {
    const client = await pool.connect();
    try {
      const query = `
        INSERT INTO score_records (student_id, score_date, score_type, sub_category, points_assigned, notes)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `;
      const values = [student_id, score_date, score_type, sub_category || null, points_assigned, notes || null];
      const result = await client.query(query, values);

      res.status(201).json({ message: `Puntuación personal para ${score_type} registrada.`, record: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error en POST /api/scores/personal:', err);
    if (err.code === '23503') { // foreign key violation (student_id no existe)
        return res.status(400).json({ message: 'Error: student_id no existe.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al registrar puntuación personal.' });
  }
});

module.exports = router;
