const express = require('express');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/teachers/profile
// @desc    Get current teacher's profile
// @access  Private (Teacher)
router.get('/profile', authMiddleware, async (req, res) => {
  // Ensure only teachers can access this
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para docentes.' });
  }

  try {
    const result = await pool.query(
      'SELECT id, full_name, nickname, email, cellphone_number, photo_url FROM teachers WHERE id = $1',
      [parseInt(req.user.id, 10)] // Explicitly parse id to integer
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de docente no encontrado.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching teacher profile:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// @route   PUT /api/teachers/profile
// @desc    Update current teacher's profile
// @access  Private (Teacher)
router.put('/profile', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para docentes.' });
  }

  const { full_name, nickname, email, cellphone_number } = req.body;
  const teacherId = req.user.id;

  // Basic validation
  if (!full_name || !email) {
    return res.status(400).json({ message: 'Nombre completo y email son requeridos.' });
  }

  try {
    // Check if email is being changed and if it's already taken by another user
    if (email !== req.user.email) {
      const emailCheck = await pool.query('SELECT id FROM teachers WHERE email = $1 AND id != $2', [email, teacherId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'El email ya está en uso por otra cuenta.' });
      }
    }

    const result = await pool.query(
      `UPDATE teachers
       SET full_name = $1, nickname = $2, email = $3, cellphone_number = $4
       WHERE id = $5
       RETURNING id, full_name, nickname, email, cellphone_number, photo_url`,
      [full_name, nickname, email, cellphone_number, teacherId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de docente no encontrado para actualizar.' });
    }

    res.json({ message: 'Perfil actualizado exitosamente.', teacher: result.rows[0] });
  } catch (err) {
    console.error('Error updating teacher profile:', err);
    // Catch unique constraint violation for email if not caught by the explicit check (race condition, etc.)
    if (err.code === '23505' && err.constraint === 'teachers_email_key') {
        return res.status(400).json({ message: 'El email ya está en uso.' });
    }
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// @route   PUT /api/teachers/password
// @desc    Change current teacher's password
// @access  Private (Teacher)
router.put('/password', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para docentes.' });
  }

  const { current_password, new_password, confirm_new_password } = req.body;
  const teacherId = req.user.id;

  if (!current_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ message: 'Todos los campos de contraseña son requeridos.' });
  }

  if (new_password !== confirm_new_password) {
    return res.status(400).json({ message: 'La nueva contraseña y su confirmación no coinciden.' });
  }

  if (new_password.length < 6) { // Example minimum length
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const userResult = await pool.query('SELECT password_hash FROM teachers WHERE id = $1', [teacherId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const teacher = userResult.rows[0];
    const isMatch = await bcrypt.compare(current_password, teacher.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);

    await pool.query('UPDATE teachers SET password_hash = $1 WHERE id = $2', [newPasswordHash, teacherId]);

    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (err) {
    console.error('Error changing teacher password:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});



module.exports = router;
