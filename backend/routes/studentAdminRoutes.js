const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Middleware de autenticación (se asume que se aplica a nivel de app.use('/api/admin/students', authMiddleware, studentAdminRoutes) en server.js)

/**
 * @route   GET /api/admin/students
 * @desc    Obtener lista de estudiantes (activos por defecto, o según query param 'active')
 * @access  Private (Teacher)
 */
router.get('/', async (req, res) => {
  const activeQuery = req.query.active; // 'true', 'false', o undefined (todos)
  let query = 'SELECT id, full_name, nickname, is_active FROM students';
  const queryParams = [];

  if (activeQuery === 'true') {
    query += ' WHERE is_active = true';
  } else if (activeQuery === 'false') {
    query += ' WHERE is_active = false';
  }
  // Si activeQuery es undefined, no se añade WHERE, por lo que se obtienen todos.

  query += ' ORDER BY full_name ASC';

  try {
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students for admin:', err);
    res.status(500).send('Server error');
  }
});


/**
 * @route   POST /api/admin/students/add-quick
 * @desc    Añadir un nuevo estudiante (modo rápido)
 * @access  Private (Teacher)
 */
router.post('/add-quick', async (req, res) => {
  const { id, full_name, nickname } = req.body;

  if (!id || !full_name) {
    return res.status(400).json({ message: 'ID y Nombre Completo son requeridos.' });
  }

  // Contraseña por defecto: ID + "pass"
  const defaultPassword = `${id}pass`;

  try {
    const newStudent = await pool.query(
      "INSERT INTO students (id, full_name, nickname, password, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id, full_name, nickname, is_active",
      [id, full_name, nickname || null, defaultPassword]
    );
    res.status(201).json(newStudent.rows[0]);
  } catch (err) {
    console.error('Error adding student (quick):', err);
    if (err.code === '23505') { // Unique violation (PK)
      return res.status(400).json({ message: 'Error: El ID de estudiante ya existe.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al añadir estudiante.' });
  }
});

/**
 * @route   PUT /api/admin/students/:studentId/edit-basic
 * @desc    Editar información básica de un estudiante (nombre, sobrenombre)
 * @access  Private (Teacher)
 */
router.put('/:studentId/edit-basic', async (req, res) => {
  const { studentId } = req.params;
  const { full_name, nickname } = req.body;

  if (!full_name) { // Nickname puede ser opcional o null
    return res.status(400).json({ message: 'Nombre Completo es requerido.' });
  }

  try {
    const updatedStudent = await pool.query(
      "UPDATE students SET full_name = $1, nickname = $2 WHERE id = $3 RETURNING id, full_name, nickname, is_active",
      [full_name, nickname || null, studentId]
    );

    if (updatedStudent.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    res.json(updatedStudent.rows[0]);
  } catch (err) {
    console.error('Error updating student (basic):', err);
    res.status(500).json({ message: 'Error interno del servidor al actualizar estudiante.' });
  }
});

/**
 * @route   PUT /api/admin/students/:studentId/set-status
 * @desc    Habilitar o Inhabilitar un estudiante
 * @access  Private (Teacher)
 */
router.put('/:studentId/set-status', async (req, res) => {
  const { studentId } = req.params;
  const { is_active } = req.body; // Espera un booleano

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ message: 'El campo is_active (true/false) es requerido.' });
  }

  try {
    const updatedStudent = await pool.query(
      "UPDATE students SET is_active = $1 WHERE id = $2 RETURNING id, full_name, nickname, is_active",
      [is_active, studentId]
    );

    if (updatedStudent.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    res.json({ message: `Estudiante ${is_active ? 'habilitado' : 'inhabilitado'} correctamente.`, student: updatedStudent.rows[0] });
  } catch (err) {
    console.error('Error updating student status:', err);
    res.status(500).json({ message: 'Error interno del servidor al actualizar estado del estudiante.' });
  }
});

/**
 * @route   DELETE /api/admin/students/:studentId/permanent-delete
 * @desc    Eliminar permanentemente un estudiante (idealmente solo si está inactivo)
 * @access  Private (Teacher)
 */
router.delete('/:studentId/permanent-delete', async (req, res) => {
  const { studentId } = req.params;

  // Opcional: Verificar si el estudiante está inactivo antes de permitir el borrado.
  // Por ahora, se permite borrar directamente, pero en una app real se podría añadir esta capa.
  // const studentCheck = await pool.query("SELECT is_active FROM students WHERE id = $1", [studentId]);
  // if (studentCheck.rows.length > 0 && studentCheck.rows[0].is_active) {
  //   return res.status(400).json({ message: 'Solo se pueden eliminar permanentemente estudiantes inactivos. Por favor, inhabilítelo primero.' });
  // }

  try {
    const deleteResult = await pool.query(
      "DELETE FROM students WHERE id = $1 RETURNING id",
      [studentId]
    );

    if (deleteResult.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado para eliminar.' });
    }
    res.json({ message: `Estudiante ${studentId} eliminado permanentemente.` });
  } catch (err) {
    console.error('Error deleting student permanently:', err);
    // Si hay FK constraints (ej. en attendance_records), la eliminación podría fallar si no se configuran ON DELETE CASCADE.
    // Ya tenemos ON DELETE CASCADE en las tablas que referencian a students.
    res.status(500).json({ message: 'Error interno del servidor al eliminar estudiante.' });
  }
});

module.exports = router;
