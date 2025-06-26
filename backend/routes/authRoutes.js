const express = require('express');
const jwt = require('jsonwebtoken');
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

module.exports = router;
