const express = require('express');
const cors = require('cors');
const pool = require('./config/db');

const app = express();
const port = process.env.PORT || 3001; // Puerto para el backend

// Middleware
app.use(cors()); // Habilitar CORS para todas las rutas
app.use(express.json()); // Para parsear JSON en las requests

// Rutas
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, full_name, nickname FROM students ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching students from DB:', err); // Log completo del error
    res.status(500).send('Server error: Could not fetch students');
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
