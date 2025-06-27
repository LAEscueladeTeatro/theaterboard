const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Endpoint de login para docentes
router.post('/login/teacher', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  try {
    const result = await pool.query('SELECT * FROM teachers WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // Usuario no encontrado
    }

    const teacher = result.rows[0];

    // Verificar contraseña hasheada
    // Nota: La contraseña en init.sql ('$2a$10$exampleHashValueForTheTeacher123') es un placeholder.
    // Para que este login funcione, se debe usar el hash real de '3ddv6e5N'.
    const isMatch = await bcrypt.compare(password, teacher.password_hash);

    if (isMatch) {
      const payload = {
        user: {
          id: teacher.id, // Usar el ID de la base de datos
          email: teacher.email,
          role: 'teacher',
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }, // Token expira en 1 hora
        (err, token) => {
          if (err) {
            console.error('Error signing JWT for teacher:', err);
            return res.status(500).json({ message: 'Error al generar el token.' });
          }
          res.json({ token });
        }
      );
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // Contraseña incorrecta
    }
  } catch (err) {
    console.error('Error en login de docente:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

// Endpoint de login para estudiantes
router.post('/login/student', async (req, res) => {
  const { student_id, password } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({ message: 'ID de estudiante y contraseña son requeridos.' });
  }

  try {
    // Asegurarse de seleccionar password_hash en lugar de password
    const result = await pool.query('SELECT id, password_hash FROM students WHERE id = $1 AND is_active = TRUE', [student_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas o estudiante inactivo.' });
    }

    const student = result.rows[0];

    // Comparar la contraseña proporcionada con el hash almacenado
    // Los placeholders en init.sql deben ser hashes reales para que esto funcione.
    const isMatch = await bcrypt.compare(password, student.password_hash);

    if (isMatch) {
      const payload = {
        user: {
          id: student.id,
          role: 'student',
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,
        { expiresIn: '1h' }, // Token expira en 1 hora
        (err, token) => {
          if (err) {
            console.error('Error signing JWT for student:', err);
            return res.status(500).json({ message: 'Error al generar el token.' });
          }
          res.json({ token });
        }
      );
    } else {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // Contraseña incorrecta
    }
  } catch (err) {
    console.error('Error en login de estudiante:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});

module.exports = router;
