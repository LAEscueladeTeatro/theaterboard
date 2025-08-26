const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

const REGISTRATION_SETTING_KEY = 'public_registration_enabled';

// @route   GET /registration-status
// @desc    Obtener el estado actual de la habilitación de registro público
// @access  Private (Teacher)
// NOTA: La ruta completa será /api/admin/settings/registration-status debido al montaje en server.js
router.get('/registration-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para docentes.' });
  }

  try {
    const result = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      [REGISTRATION_SETTING_KEY]
    );

    if (result.rows.length === 0) {
      // Si no existe, se asume true (o el valor por defecto que se insertó en init.sql)
      // Idealmente, init.sql asegura que la fila exista.
      // Para ser robusto, podemos insertar el default aquí si no existe, o devolver un default.
      // Devolveré true por defecto para la lógica del frontend si no se encuentra.
      return res.json({ enabled: true });
    }

    const isEnabled = result.rows[0].setting_value === 'true';
    res.json({ enabled: isEnabled });

  } catch (err) {
    console.error('Error fetching registration status:', err.message);
    res.status(500).json({ message: 'Error interno del servidor al obtener el estado del registro.' });
  }
});

// @route   PUT /registration-status
// @desc    Actualizar el estado de la habilitación de registro público
// @access  Private (Teacher)
router.put('/registration-status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Acceso denegado. Solo para docentes.' });
  }

  const { enabled } = req.body;

  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ message: 'El valor de "enabled" debe ser un booleano (true/false).' });
  }

  const settingValue = enabled ? 'true' : 'false';

  try {
    const result = await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value)
       VALUES ($1, $2)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = EXCLUDED.setting_value
       RETURNING setting_value;`,
      [REGISTRATION_SETTING_KEY, settingValue]
    );

    if (result.rows.length > 0) {
      res.json({
        message: `Inscripciones públicas ${enabled ? 'habilitadas' : 'deshabilitadas'} correctamente.`,
        enabled: enabled
      });
    } else {
      res.status(500).json({ message: 'No se pudo actualizar la configuración.' });
    }
  } catch (err) {
    console.error('Error updating registration status:', err.message);
    res.status(500).json({ message: 'Error interno del servidor al actualizar el estado del registro.' });
  }
});

// @route   GET /api/teachers/all-face-descriptors
// @desc    Get all registered face descriptors for attendance
// @access  Private (Teacher)
router.get('/all-face-descriptors', authMiddleware, async (req, res) => {
  // Asegurarse de que solo un docente pueda acceder
  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }

  try {
    // 1. Consultar la base de datos por todos los estudiantes que tengan un descriptor facial
    const result = await pool.query(
      'SELECT id, full_name, face_descriptor FROM students WHERE face_descriptor IS NOT NULL'
    );

    // 2. Formatear los datos para que face-api.js los entienda
    const labeledDescriptors = result.rows.map(student => {
      // El frontend espera un objeto con "label" y "descriptor"
      return {
        label: student.full_name, // El nombre que se mostrará
        descriptor: student.face_descriptor // La "huella facial"
      };
    });

    // 3. Enviar la lista formateada al frontend
    res.json(labeledDescriptors);

  } catch (err) {
    console.error('Error fetching face descriptors:', err);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
});
module.exports = router;
