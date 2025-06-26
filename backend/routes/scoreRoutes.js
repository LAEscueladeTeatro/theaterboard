const express = require('express');
const router = express.Router();
const pool = require('../config/db');
// authMiddleware se aplicará a nivel de app.use() en server.js para todas las rutas de scores

// Constantes para tipos de puntuación (para consistencia con el frontend y la lógica)
const SCORE_TYPES = {
  ROPA_TRABAJO: 'ROPA_TRABAJO',
  MATERIALES: 'MATERIALES',
  LIMPIEZA: 'LIMPIEZA',
  PARTICIPACION: 'PARTICIPACION',
  CONDUCTA: 'CONDUCTA',
  USO_CELULAR: 'USO_CELULAR',
};

// Puntos por defecto para grupales (pueden ser configurables o fijos)
const GROUP_POINTS = {
  COMPLIANT: 1,    // +1 si cumple
  NON_COMPLIANT: -1 // -1 si no cumple (ejemplo, puedes ajustarlo)
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
  const { score_type, score_date, students_compliant = [], students_non_compliant = [] } = req.body;

  // Validación de entrada
  if (!score_type || !score_date) {
    return res.status(400).json({ message: 'score_type y score_date son requeridos.' });
  }
  if (![SCORE_TYPES.ROPA_TRABAJO, SCORE_TYPES.MATERIALES, SCORE_TYPES.LIMPIEZA].includes(score_type)) {
    return res.status(400).json({ message: 'score_type no es válido para puntuaciones grupales.' });
  }
  if (!Array.isArray(students_compliant) || !Array.isArray(students_non_compliant)) {
    return res.status(400).json({ message: 'students_compliant y students_non_compliant deben ser arrays.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN'); // Iniciar transacción

    const records = [];

    // Procesar estudiantes que cumplen
    for (const student_id of students_compliant) {
      const result = await client.query(
        `INSERT INTO score_records (student_id, score_date, score_type, sub_category, points_assigned, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [student_id, score_date, score_type, 'Cumple', GROUP_POINTS.COMPLIANT, null]
      );
      records.push(result.rows[0]);
    }

    // Procesar estudiantes que no cumplen
    for (const student_id of students_non_compliant) {
      const result = await client.query(
        `INSERT INTO score_records (student_id, score_date, score_type, sub_category, points_assigned, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [student_id, score_date, score_type, 'No Cumple', GROUP_POINTS.NON_COMPLIANT, null]
      );
      records.push(result.rows[0]);
    }

    await client.query('COMMIT'); // Finalizar transacción
    res.status(201).json({ message: `Puntuaciones para ${score_type} registradas.`, count: records.length, records });

  } catch (err) {
    await client.query('ROLLBACK'); // Revertir en caso de error
    console.error('Error en POST /api/scores/group:', err);
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
  if (!student_id || !score_type || !score_date || points_assigned === undefined) {
    return res.status(400).json({ message: 'student_id, score_type, score_date, y points_assigned son requeridos.' });
  }
  if (![SCORE_TYPES.PARTICIPACION, SCORE_TYPES.CONDUCTA, SCORE_TYPES.USO_CELULAR].includes(score_type)) {
    return res.status(400).json({ message: 'score_type no es válido para puntuaciones personales.' });
  }
  if (typeof points_assigned !== 'number') {
    return res.status(400).json({ message: 'points_assigned debe ser un número.' });
  }

  // Validación específica de puntos según el tipo (ejemplos)
  if (score_type === SCORE_TYPES.PARTICIPACION && ![2, -1].includes(points_assigned)) {
    return res.status(400).json({ message: 'Puntos para PARTICIPACION deben ser +2 o -1.' });
  }
  if (score_type === SCORE_TYPES.CONDUCTA && ![-3, -2, -1].includes(points_assigned)) {
    return res.status(400).json({ message: 'Puntos para CONDUCTA deben ser -3, -2, o -1.' });
  }
  if (score_type === SCORE_TYPES.USO_CELULAR && ![-3, -1].includes(points_assigned)) {
    return res.status(400).json({ message: 'Puntos para USO_CELULAR deben ser -3 o -1.' });
  }

  try {
    const client = await pool.connect(); // Usar transacciones no es estrictamente necesario para una sola inserción,
                                      // pero es buena práctica si la lógica se expandiera.
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
