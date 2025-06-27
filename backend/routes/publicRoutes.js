const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // Importar bcryptjs

const REGISTRATION_SETTING_KEY = 'public_registration_enabled';

// @route   GET /api/public/settings/registration-status-check
// @desc    Verificar públicamente si las inscripciones están habilitadas
// @access  Public
router.get('/settings/registration-status-check', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT setting_value FROM system_settings WHERE setting_key = $1',
      [REGISTRATION_SETTING_KEY]
    );
    if (result.rows.length === 0) {
      // Si no existe la configuración, se asume habilitado por defecto como medida de seguridad para no bloquear.
      // El script init.sql debería asegurar que este valor exista.
      return res.json({ enabled: true, message: "Configuración no encontrada, asumiendo habilitado." });
    }
    const isEnabled = result.rows[0].setting_value === 'true';
    res.json({ enabled: isEnabled });
  } catch (err) {
    console.error('Error fetching public registration status:', err.message);
    // En caso de error de BD al consultar, es más seguro asumir que podría estar deshabilitado o que hay un problema.
    // Devolver un estado que el frontend pueda interpretar como "no se pudo verificar, intente más tarde".
    res.status(503).json({ enabled: false, message: 'No se pudo verificar el estado del registro en este momento.' });
  }
});


/**
 * @route   POST /api/public/register
 * @desc    Registro público de nuevos estudiantes
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const {
    full_name, // Apellidos y Nombres
    nickname,
    age,
    birth_date, // YYYY-MM-DD
    phone,
    email,
    // Datos del apoderado (condicionales)
    guardian_full_name,
    guardian_relationship,
    guardian_phone,
    guardian_email,
    // Otros datos
    medical_conditions,
    comments,
    emergency_contact_name,
    emergency_contact_phone
  } = req.body;

  // Validación de campos obligatorios
  if (!full_name || !nickname || age === undefined || !birth_date || !phone || !email) {
    return res.status(400).json({ message: 'Campos obligatorios faltantes: Apellidos y Nombres, Sobrenombre, Edad, Fecha de Nacimiento, Celular, Correo.' });
  }

  const client = await pool.connect(); // Mover la conexión aquí para usarla antes
  try {
    // Verificar si el registro público está habilitado
    const registrationSetting = await client.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = 'public_registration_enabled'"
    );

    if (registrationSetting.rows.length === 0 || registrationSetting.rows[0].setting_value !== 'true') {
      // Si no está definido o no es 'true', se considera deshabilitado
      client.release(); // Liberar cliente antes de retornar
      return res.status(403).json({ message: 'Las inscripciones públicas están cerradas temporalmente.' });
    }

    // Validación de edad para datos del apoderado (continuar solo si el registro está habilitado)
  const studentAge = parseInt(age, 10);
  if (isNaN(studentAge)) {
      return res.status(400).json({ message: 'La edad debe ser un número.' });
  }

  if (studentAge < 18) {
    if (!guardian_full_name || !guardian_relationship || !guardian_phone || !guardian_email) {
      return res.status(400).json({ message: 'Para menores de 18 años, los datos completos del apoderado son obligatorios.' });
    }
  }

    // La conexión a la BD ya se hizo arriba para chequear el setting.
    // Continuar con la transacción.
    await client.query('BEGIN');

    // Lógica para encontrar el siguiente ID disponible (reutilizada de studentAdminRoutes)
    const existingIdsResult = await client.query("SELECT id FROM students WHERE id LIKE 'ET%' ORDER BY id ASC");
    const existingNumericIds = existingIdsResult.rows
      .map(row => parseInt(row.id.substring(2), 10))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumericId = 1;
    for (const numericId of existingNumericIds) {
      if (numericId === nextNumericId) {
        nextNumericId++;
      } else if (numericId > nextNumericId) {
        break;
      }
    }

    const newId = `ET${nextNumericId.toString().padStart(3, '0')}`;
    const defaultPassword = `${newId}pass`; // Contraseña por defecto

    // Hashear la contraseña por defecto
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const newStudentResult = await client.query(
      `INSERT INTO students (
         id, full_name, nickname, password_hash, is_active, age, birth_date, phone, email,
         guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
         medical_conditions, comments, emergency_contact_name, emergency_contact_phone, photo_url
       ) VALUES ($1, $2, $3, $4, true, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NULL)
       RETURNING id, full_name, email`, // Se inserta NULL para photo_url inicialmente
      [
        newId, full_name, nickname, hashedPassword, studentAge, birth_date, phone, email, // Usar hashedPassword
        guardian_full_name || null, guardian_relationship || null, guardian_phone || null, guardian_email || null,
        medical_conditions || null, comments || null, emergency_contact_name || null, emergency_contact_phone || null
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({
        message: '¡Registro exitoso! Tu ID de estudiante es ' + newStudentResult.rows[0].id,
        student: newStudentResult.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en POST /api/public/register:', err);
    if (err.code === '23505' && err.constraint === 'students_email_key') {
      return res.status(400).json({ message: 'Error: El correo electrónico ya está registrado.' });
    }
    // El error de ID duplicado no debería ocurrir con la generación automática si la lógica es correcta
    res.status(500).json({ message: 'Error interno del servidor al procesar el registro.' });
  } finally {
    client.release();
  }
});

module.exports = router;
