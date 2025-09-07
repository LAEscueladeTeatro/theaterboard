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
const teacherRoutes = require('./routes/teacherRoutes'); // <-- Importar rutas de docente
const groupRoutes = require('./routes/groupRoutes');

// Importar Middleware (si es necesario globalmente o para rutas específicas aquí)
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 3001; // Puerto para el backend

// Middleware Global
// backend/server.js
const corsOptions = {
  origin: 'https://theaterboard.onrender.com', // <-- Pega aquí la URL de tu frontend
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json()); // Para parsear JSON en las requests

// Definición de Rutas
app.use('/api/auth', authRoutes);
app.use('/api/teachers', teacherRoutes); // Rutas para el perfil del docente (ya usan authMiddleware internamente)
app.use('/api/attendance', authMiddleware, attendanceRoutes);
app.use('/api/scores', authMiddleware, scoreRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/student', authMiddleware, studentRoutes);
app.use('/api/admin/students', authMiddleware, studentAdminRoutes);
app.use('/api/admin/settings', authMiddleware, adminSettingsRoutes); // <-- Montar nuevas rutas
app.use('/api/groups', authMiddleware, groupRoutes);
app.use('/api/public', publicRoutes); // Rutas públicas (ej: /api/public/register)

const ensureDatabaseSchema = async () => {
    const client = await pool.connect();
    try {
        // 1. Check for 'groups' table
        const tableCheck = await client.query(
            "SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'groups'"
        );

        if (tableCheck.rows.length === 0) {
            console.log("Schema migration needed: 'groups' table not found. Creating it...");
            await client.query('BEGIN');
            // Create groups table
            await client.query(`
                CREATE TABLE groups (
                    group_id SERIAL PRIMARY KEY,
                    name VARCHAR(100) NOT NULL,
                    schedule_description TEXT
                );
            `);
            // Populate groups table
            await client.query(`
                INSERT INTO groups (name, schedule_description) VALUES
                ('Grupo 1', 'Jueves y Viernes - 5:00 PM'),
                ('Grupo 2', 'Sábados - 3:00 PM y Martes - 5:00 PM'),
                ('Grupo 3', 'Lunes y Miércoles - 5:00 PM');
            `);
            await client.query('COMMIT');
            console.log("'groups' table created and populated successfully.");
        }

        // 2. Check for 'group_id' column in 'students' table
        const columnCheck = await client.query(
            "SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'students' AND column_name = 'group_id'"
        );

        if (columnCheck.rows.length === 0) {
            console.log("Schema migration needed: 'group_id' column not found in 'students' table. Adding it...");
            await client.query(`
                ALTER TABLE students
                ADD COLUMN group_id INTEGER REFERENCES groups(group_id) ON DELETE SET NULL;
            `);
            console.log("'group_id' column added to 'students' table successfully.");
        }

    } catch (err) {
        console.error('!!! ERROR during database schema check/migration !!!');
        console.error(err.stack);
        await client.query('ROLLBACK');
    } finally {
        client.release();
    }
};


// Iniciar servidor
app.listen(port, async () => { // Convertir a función async
  console.log(`Backend server is running on port ${port}`);
  // Verificar conexión a la base de datos al iniciar
  try {
    const client = await pool.connect();
    console.log('Successfully connected to the database.');
    await client.query('SELECT NOW()'); // Prueba una consulta simple
    client.release();
    console.log('Database connection test query successful.');

    // Ensure the database schema is up to date
    await ensureDatabaseSchema();

  } catch (err) {
    console.error('!!! CRITICAL: Failed to connect to the database on startup !!!');
    console.error(err.stack);
    // Opcionalmente, podrías querer que el proceso termine si no puede conectarse a la BD:
    // process.exit(1);
  }
});
