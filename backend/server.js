const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

// Importar Rutas
const authRoutes = require('./routes/authRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const scoreRoutes = require('./routes/scoreRoutes');
const reportRoutes = require('./routes/reportRoutes');
const studentRoutes = require('./routes/studentRoutes');
const studentAdminRoutes = require('./routes/studentAdminRoutes');
const publicRoutes = require('./routes/publicRoutes'); // Nuevas rutas públicas
const adminSettingsRoutes = require('./routes/adminSettingsRoutes'); // <-- Importar nuevas rutas

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
app.use('/api/scores', authMiddleware, scoreRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/student', authMiddleware, studentRoutes);
app.use('/api/admin/students', authMiddleware, studentAdminRoutes);
app.use('/api/admin/settings', authMiddleware, adminSettingsRoutes); // <-- Montar nuevas rutas
app.use('/api/public', publicRoutes); // Rutas públicas (ej: /api/public/register)

// La ruta GET /api/students original se elimina, ya que su funcionalidad ahora está en GET /api/admin/students
// y es más completa (permite filtrar por is_active).
// El frontend deberá actualizarse para usar /api/admin/students?active=true para la lista principal.

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
