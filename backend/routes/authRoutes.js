const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../config/db'); // <--- AÑADIR ESTA LÍNEA
// const bcrypt = require('bcryptjs'); // Para uso futuro con contraseñas hasheadas

const router = express.Router();

// Credenciales fijas del docente
const TEACHER_EMAIL = 'luisacunach@teacherboard.com';
const TEACHER_PASSWORD = '3ddv6e5N'; // En un caso real, esto debería ser un hash

// Endpoint de login para docentes
router.post('/login/teacher', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  // Verificar credenciales (comparación directa por ahora)
  if (email === TEACHER_EMAIL && password === TEACHER_PASSWORD) {
    // Generar JWT
    const payload = {
      user: {
        id: 'teacher001', // Un ID de ejemplo para el docente
        email: TEACHER_EMAIL,
        role: 'teacher',
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '1h' }, // Token expira en 1 hora
      (err, token) => {
        if (err) {
            console.error('Error signing JWT:', err);
            return res.status(500).json({ message: 'Error al generar el token.' });
        }
        res.json({ token });
      }
    );
  } else {
    res.status(401).json({ message: 'Credenciales inválidas.' });
  }
});

// Endpoint de login para estudiantes
router.post('/login/student', async (req, res) => {
  const { student_id, password } = req.body;

  if (!student_id || !password) {
    return res.status(400).json({ message: 'ID de estudiante y contraseña son requeridos.' });
  }

  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [student_id]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas.' }); // Estudiante no encontrado
    }

    const student = result.rows[0];

    // Comparación directa de contraseña (NO SEGURO PARA PRODUCCIÓN)
    if (password === student.password) {
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
