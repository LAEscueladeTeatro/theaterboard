const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const scoreRoutes = require('./routes/scoreRoutes'); // Nuevas rutas de puntuaciones

// Importar Middleware (si es necesario globalmente o para rutas específicas aquí)
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 3001; // Puerto para el backend

// Middleware Global
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Para parsear JSON en las requests

// Definición de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/scores', authMiddleware, scoreRoutes); // Nuevas rutas de puntuaciones, protegidas

// Ruta de estudiantes (considerar si también debe ser protegida)
// Por ahora, la dejamos como estaba, pero podría requerir authMiddleware si solo docentes deben verla.
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, full_name, nickname FROM students ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students from DB:', err); // Log completo del error
    res.status(500).send('Server error: Could not fetch students');
  }
});

// Ejemplo de ruta protegida
app.get('/api/teacher/profile', authMiddleware, (req, res) => {
  // req.user es accesible aquí gracias al authMiddleware
  res.json({
    message: 'Este es un perfil de docente protegido.',
    user: req.user
  });
});


// Iniciar servidor
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
