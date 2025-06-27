const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // Asegúrate de que la ruta a db.js sea correcta
const bcrypt = require('bcrypt');

const router = express.Router();

// --- RUTA PARA LOGIN DE DOCENTE ---
// Ahora la ruta es POST /api/auth/teacher
router.post('/teacher', async (req, res) => {
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

        // Comparar la contraseña proporcionada con el hash almacenado
        const isMatch = await bcrypt.compare(password, teacher.password_hash);

        if (isMatch) {
            const payload = {
                user: {
                    id: teacher.id,
                    email: teacher.email,
                    role: 'teacher',
                },
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
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

// --- RUTA PARA LOGIN DE ESTUDIANTE ---
// Ahora la ruta es POST /api/auth/student
router.post('/student', async (req, res) => {
    const { student_id, password } = req.body;

    if (!student_id || !password) {
        return res.status(400).json({ message: 'ID de estudiante y contraseña son requeridos.' });
    }

    try {
        const result = await pool.query('SELECT * FROM students WHERE id = $1 AND is_active = TRUE', [student_id]);
        
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas o estudiante inactivo.' });
        }

        const student = result.rows[0];

        // Comparar la contraseña proporcionada con el hash almacenado
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
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
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