const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // Importar bcryptjs

// Middleware de autenticación (se asume que se aplica a nivel de app.use('/api/admin/students', authMiddleware, studentAdminRoutes) en server.js)

/**
 * @route   GET /api/admin/students
 * @desc    Obtener lista de estudiantes (activos por defecto, o según query param 'active')
 * @access  Private (Teacher)
 */
router.get('/', async (req, res) => {
  const activeQuery = req.query.active;
  // Devolver todos los campos para la vista de "Base de Datos" y edición completa.
  // La contraseña no se devuelve.
  let query = `
    SELECT id, full_name, nickname, is_active, age, birth_date, phone, email,
           guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
           medical_conditions, comments, emergency_contact_name, emergency_contact_phone
    FROM students
  `;
  const queryParams = [];

  if (activeQuery === 'true') {
    query += ' WHERE is_active = true';
  } else if (activeQuery === 'false') {
    query += ' WHERE is_active = false';
  }
  // Si activeQuery es undefined, no se añade WHERE, por lo que se obtienen todos.
  // Ajuste: si activeQuery no es 'false', por defecto listar activos o todos.
  // Para ser más explícito: si activeQuery es 'true', activos. Si 'false', inactivos. Si no, todos.
  // O, como estaba: 'true' activos, 'false' inactivos, undefined/otro -> todos.
  // Prefiero que el default sea activos si no se especifica, para la lista principal.
  // Para obtener TODOS, se podría añadir un ?active=all o similar, o dejarlo como está (undefined).
  // Por ahora, mantendré la lógica: ?active=true -> activos, ?active=false -> inactivos, sin query param -> todos.

  query += ' ORDER BY id ASC'; // Cambiado de full_name a id

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
 * @desc    Añadir un nuevo estudiante (modo rápido) - ID se genera automáticamente
 * @access  Private (Teacher)
 */
router.post('/add-quick', async (req, res) => {
  const { full_name, nickname } = req.body; // ID ya no se recibe del frontend

  if (!full_name) {
    return res.status(400).json({ message: 'Nombre Completo es requerido.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lógica para encontrar el siguiente ID disponible
    const existingIdsResult = await client.query("SELECT id FROM students WHERE id LIKE 'ET%' ORDER BY id ASC");
    const existingNumericIds = existingIdsResult.rows
      .map(row => parseInt(row.id.substring(2), 10))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumericId = 1;
    for (const numericId of existingNumericIds) {
      if (numericId === nextNumericId) {
        nextNumericId++;
      } else if (numericId > nextNumericId) {
        break; // Encontramos un hueco
      }
    }

    const newId = `ET${nextNumericId.toString().padStart(3, '0')}`;
    const defaultPassword = `${newId}pass`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const newStudentResult = await client.query(
      "INSERT INTO students (id, full_name, nickname, password_hash, is_active) VALUES ($1, $2, $3, $4, true) RETURNING id, full_name, nickname, is_active", // Columna corregida a password_hash
      [newId, full_name, nickname || null, hashedPassword] // Usar hashedPassword
    );

    await client.query('COMMIT');
    // Incluir defaultPassword en la respuesta
    const studentData = newStudentResult.rows[0];
    res.status(201).json({ ...studentData, defaultPassword });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error adding student (quick with auto-id):', err);
    // No es probable un '23505' por PK si la lógica de ID es correcta, pero podría haber otros errores.
    res.status(500).json({ message: 'Error interno del servidor al añadir estudiante.' });
  } finally {
    client.release();
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


/**
 * @route   PUT /api/admin/students/:studentId/edit-full
 * @desc    Editar todos los campos de un estudiante
 * @access  Private (Teacher)
 */
router.put('/:studentId/edit-full', async (req, res) => {
  const { studentId } = req.params;
  const {
    full_name, nickname, is_active, age, birth_date, phone, email,
    guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
    medical_conditions, comments, emergency_contact_name, emergency_contact_phone
  } = req.body;

  // Validación básica (al menos el nombre completo es usualmente requerido)
  if (!full_name) {
    return res.status(400).json({ message: 'Nombre Completo es requerido.' });
  }
  if (typeof is_active !== 'boolean') {
      return res.status(400).json({ message: 'is_active debe ser un valor booleano.'})
  }
  // Aquí se podrían añadir más validaciones para cada campo (formato de email, teléfono, etc.)

  try {
    const updateQuery = `
      UPDATE students SET
        full_name = $1, nickname = $2, is_active = $3, age = $4, birth_date = $5,
        phone = $6, email = $7, guardian_full_name = $8, guardian_relationship = $9,
        guardian_phone = $10, guardian_email = $11, medical_conditions = $12,
        comments = $13, emergency_contact_name = $14, emergency_contact_phone = $15
      WHERE id = $16
      RETURNING id, full_name, nickname, is_active, age, birth_date, phone, email,
                guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
                medical_conditions, comments, emergency_contact_name, emergency_contact_phone, photo_url;
    `;
    const values = [
      full_name, nickname, is_active, age, birth_date, phone, email,
      guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
      medical_conditions, comments, emergency_contact_name, emergency_contact_phone,
      studentId
    ];

    const updatedStudent = await pool.query(updateQuery, values);

    if (updatedStudent.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    res.json(updatedStudent.rows[0]); // password_hash is not included in RETURNING

  } catch (err) {
    console.error('Error updating student (full):', err);
    if (err.code === '23505' && err.constraint === 'students_email_key') {
      return res.status(400).json({ message: 'Error: El correo electrónico ya está registrado por otro estudiante.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar estudiante.' });
  }
});


module.exports = router;
