const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcryptjs'); // Import bcryptjs for password operations
// El authMiddleware se aplicará globalmente a estas rutas en server.js (confirm from server.js)

// Umbrales para el Estado de Acceso a Casting (actualizados)
const CASTING_THRESHOLDS = {
  APTO_MIN_POINTS: 50,
  EN_EVALUACION_MIN_POINTS: 30,
  // NO_APTO es implícito si es menor que EN_EVALUACION_MIN_POINTS
};

const determineCastingStatus = (totalPoints) => {
  if (totalPoints >= CASTING_THRESHOLDS.APTO_MIN_POINTS) { // 50 o más
    return 'APTO';
  } else if (totalPoints >= CASTING_THRESHOLDS.EN_EVALUACION_MIN_POINTS) { // 30 a 49
    return 'EN EVALUACIÓN';
  } else { // Menos de 30
    return 'NO APTO';
  }
};

/**
 * @route   GET /api/student/dashboard-data
 * @desc    Obtener datos para el dashboard del estudiante (info, puntaje mensual, estado casting)
 * @access  Private (Student)
 */
router.get('/dashboard-data', async (req, res) => {
  // El studentId se extrae del token JWT verificado por authMiddleware
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado: No es un estudiante autenticado.' });
  }
  const studentId = req.user.id;

  // Obtener el mes actual en formato YYYY-MM para las consultas de puntos
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;

  const client = await pool.connect();
  try {
    // 1. Información del estudiante
    // Incluir photo_url real en la consulta
    const studentInfoQuery = 'SELECT id, full_name, nickname, photo_url FROM students WHERE id = $1 AND is_active = TRUE';
    const studentInfoResult = await client.query(studentInfoQuery, [studentId]);

    if (studentInfoResult.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado o inactivo.' });
    }
    const studentInfo = studentInfoResult.rows[0];
    // No más simulación de photo_url, se obtiene de la DB. Si es NULL, el frontend lo manejará.

    // 2. Calcular puntaje total del mes actual (similar a la lógica de /monthly-ranking)
    // (Esta lógica podría refactorizarse en una función helper si se usa en múltiples lugares)
    const attendancePointsQuery = `
      SELECT COALESCE(SUM(points_earned), 0) AS status_points, COALESCE(SUM(base_attendance_points), 0) AS presence_points
      FROM attendance_records WHERE student_id = $1 AND TO_CHAR(attendance_date, 'YYYY-MM') = $2;`;
    const bonusPointsQuery = `
      SELECT COALESCE(SUM(points_awarded), 0) AS total_bonus
      FROM daily_bonus_log WHERE student_id = $1 AND TO_CHAR(bonus_date, 'YYYY-MM') = $2;`;
    const scoresQuery = `
      SELECT COALESCE(SUM(points_assigned), 0) AS total_score_points
      FROM score_records WHERE student_id = $1 AND TO_CHAR(score_date, 'YYYY-MM') = $2;`;

    const [attPointsRes, bonusPointsRes, scoresRes] = await Promise.all([
      client.query(attendancePointsQuery, [studentId, currentMonth]),
      client.query(bonusPointsQuery, [studentId, currentMonth]),
      client.query(scoresQuery, [studentId, currentMonth]),
    ]);

    const totalAttendancePoints = parseInt(attPointsRes.rows[0]?.status_points || 0, 10) + parseInt(attPointsRes.rows[0]?.presence_points || 0, 10);
    const totalBonusPoints = parseInt(bonusPointsRes.rows[0]?.total_bonus || 0, 10);
    const totalAdditionalScores = parseInt(scoresRes.rows[0]?.total_score_points || 0, 10);
    const monthlyTotalPoints = totalAttendancePoints + totalBonusPoints + totalAdditionalScores;

    // 3. Determinar Estado de Acceso a Casting
    const castingStatus = determineCastingStatus(monthlyTotalPoints);

    // (Opcional) Obtener posición en el ranking del mes actual
    // Esta consulta es más compleja, la omitiré por ahora para simplificar,
    // pero se podría añadir si es un requisito fuerte para el dashboard del estudiante.
    // El estudiante podría ir a la página de Ranking general si desea ver su posición.

    // 4. Calcular posición en el ranking mensual
    //    Reutiliza la lógica de /api/reports/monthly-ranking pero solo para obtener la posición del estudiante actual.
    const rankingQuery = `
      WITH student_monthly_scores AS (
        SELECT
          s.id AS student_id,
          (COALESCE(SUM(ar.points_earned + ar.base_attendance_points), 0) +
           COALESCE(SUM(dbl.points_awarded), 0) +
           COALESCE(SUM(sr.points_assigned), 0)) AS total_points
        FROM students s
        LEFT JOIN attendance_records ar ON s.id = ar.student_id AND TO_CHAR(ar.attendance_date, 'YYYY-MM') = $2
        LEFT JOIN daily_bonus_log dbl ON s.id = dbl.student_id AND TO_CHAR(dbl.bonus_date, 'YYYY-MM') = $2
        LEFT JOIN score_records sr ON s.id = sr.student_id AND TO_CHAR(sr.score_date, 'YYYY-MM') = $2
        GROUP BY s.id
      ), ranked_students AS (
        SELECT
          student_id,
          total_points,
          RANK() OVER (ORDER BY total_points DESC) as rank_position
        FROM student_monthly_scores
      )
      SELECT rank_position FROM ranked_students WHERE student_id = $1;
    `;
    // Nota: Esta consulta de ranking puede ser pesada. Para optimizar, se podría tener una tabla de ranking precalculada y actualizada periódicamente.
    // O, si el número de estudiantes no es masivo, puede ser aceptable.

    let rankingPosition = null;
    try {
        const rankingResult = await client.query(rankingQuery, [studentId, currentMonth]);
        if (rankingResult.rows.length > 0) {
            rankingPosition = parseInt(rankingResult.rows[0].rank_position, 10);
        }
    } catch (rankErr) {
        console.error("Error calculating student ranking position:", rankErr);
        // No hacer que falle toda la solicitud si el ranking falla, pero loguear el error.
        rankingPosition = null;
    }


    res.json({
      studentInfo,
      currentMonth,
      monthlyTotalPoints,
      castingStatus,
      rankingPosition,
    });

  } catch (err) {
    console.error('Error en GET /api/student/dashboard-data:', err);
    res.status(500).json({ message: 'Error interno del servidor al obtener datos del dashboard.' });
  } finally {
    client.release();
  }
});


/**
 * @route   GET /api/student/my-scores-summary
 * @desc    Obtener desglose de puntajes para el estudiante autenticado (diario o mensual)
 * @access  Private (Student)
 * @query   type=<daily|monthly>, date=<YYYY-MM-DD o YYYY-MM>
 */
router.get('/my-scores-summary', async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const studentId = req.user.id;
  const { type, date } = req.query;

  if (!type || !date) {
    return res.status(400).json({ message: 'Los parámetros type (daily/monthly) y date son requeridos.' });
  }

  let detailedRecords = [];
  const client = await pool.connect();

  try {
    if (type === 'daily') {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Para type=daily, el formato de date debe ser YYYY-MM-DD.' });
      }
      // Consulta para registros de asistencia del día
      const attendanceRes = await client.query(
        `SELECT 'Asistencia' as record_type, status as description, (points_earned + base_attendance_points) as points, notes, recorded_at
         FROM attendance_records WHERE student_id = $1 AND attendance_date = $2`,
        [studentId, date]
      );
      detailedRecords.push(...attendanceRes.rows.map(r => ({...r, source: 'attendance'})));

      // Consulta para bono del día
      const bonusRes = await client.query(
        `SELECT 'Bono Madrugador' as record_type, 'Bono Otorgado' as description, points_awarded as points, NULL as notes, awarded_at as recorded_at
         FROM daily_bonus_log WHERE student_id = $1 AND bonus_date = $2`,
        [studentId, date]
      );
      detailedRecords.push(...bonusRes.rows.map(r => ({...r, source: 'bonus'})));

      // Consulta para scores adicionales del día
      const scoresRes = await client.query(
        `SELECT score_type as record_type, COALESCE(sub_category, score_type) as description, points_assigned as points, notes, recorded_at
         FROM score_records WHERE student_id = $1 AND score_date = $2`,
        [studentId, date]
      );
      detailedRecords.push(...scoresRes.rows.map(r => ({...r, source: 'score'})));

    } else if (type === 'monthly') {
      if (!/^\d{4}-\d{2}$/.test(date)) {
        return res.status(400).json({ message: 'Para type=monthly, el formato de date debe ser YYYY-MM.' });
      }
      // Consulta para registros de asistencia del mes
       const attendanceRes = await client.query(
        `SELECT attendance_date, 'Asistencia' as record_type, status as description, (points_earned + base_attendance_points) as points, notes, recorded_at
         FROM attendance_records WHERE student_id = $1 AND TO_CHAR(attendance_date, 'YYYY-MM') = $2 ORDER BY attendance_date, recorded_at`,
        [studentId, date]
      );
      detailedRecords.push(...attendanceRes.rows.map(r => ({...r, source: 'attendance'})));

      // Consulta para bono del mes
      const bonusRes = await client.query(
        `SELECT bonus_date as attendance_date, 'Bono Madrugador' as record_type, 'Bono Otorgado' as description, points_awarded as points, NULL as notes, awarded_at as recorded_at
         FROM daily_bonus_log WHERE student_id = $1 AND TO_CHAR(bonus_date, 'YYYY-MM') = $2 ORDER BY bonus_date, recorded_at`,
        [studentId, date]
      );
      detailedRecords.push(...bonusRes.rows.map(r => ({...r, source: 'bonus'})));

      // Consulta para scores adicionales del mes
      const scoresRes = await client.query(
        `SELECT score_date as attendance_date, score_type as record_type, COALESCE(sub_category, score_type) as description, points_assigned as points, notes, recorded_at
         FROM score_records WHERE student_id = $1 AND TO_CHAR(score_date, 'YYYY-MM') = $2 ORDER BY score_date, recorded_at`,
        [studentId, date]
      );
      detailedRecords.push(...scoresRes.rows.map(r => ({...r, source: 'score'})));

      // Ordenar todos los registros por fecha y luego por hora de registro para una vista cronológica
      detailedRecords.sort((a,b) => new Date(a.attendance_date || a.recorded_at) - new Date(b.attendance_date || b.recorded_at) || new Date(a.recorded_at) - new Date(b.recorded_at));

      // Calcular puntaje total y ranking para el mes consultado
      let monthlyTotalPoints = 0;
      let rankingPosition = null;

      // Sumar puntos de detailedRecords para el total del mes
      monthlyTotalPoints = detailedRecords.reduce((sum, record) => sum + record.points, 0);

      // Calcular ranking para el mes (date es YYYY-MM)
      const rankingQuery = `
        WITH student_monthly_scores AS (
          SELECT
            s.id AS student_id,
            (COALESCE(SUM(ar.points_earned + ar.base_attendance_points), 0) +
             COALESCE(SUM(dbl.points_awarded), 0) +
             COALESCE(SUM(sr.points_assigned), 0)) AS total_points
          FROM students s
          LEFT JOIN attendance_records ar ON s.id = ar.student_id AND TO_CHAR(ar.attendance_date, 'YYYY-MM') = $2
          LEFT JOIN daily_bonus_log dbl ON s.id = dbl.student_id AND TO_CHAR(dbl.bonus_date, 'YYYY-MM') = $2
          LEFT JOIN score_records sr ON s.id = sr.student_id AND TO_CHAR(sr.score_date, 'YYYY-MM') = $2
          WHERE s.is_active = TRUE
          GROUP BY s.id
        ), ranked_students AS (
          SELECT
            student_id,
            total_points,
            RANK() OVER (ORDER BY total_points DESC) as rank_position
          FROM student_monthly_scores
        )
        SELECT rank_position FROM ranked_students WHERE student_id = $1;
      `;
      try {
        const rankingResult = await client.query(rankingQuery, [studentId, date]);
        if (rankingResult.rows.length > 0) {
          rankingPosition = parseInt(rankingResult.rows[0].rank_position, 10);
        }
      } catch (rankErr) {
        console.error(`Error calculating ranking for student ${studentId} in month ${date}:`, rankErr);
        // No hacer que falle toda la solicitud si el ranking falla
      }

      res.json({
        studentId,
        queryType: type,
        queryDate: date,
        records: detailedRecords,
        monthlyTotalPoints, // Añadido
        rankingPosition,    // Añadido
      });

    } else {
      return res.status(400).json({ message: 'El parámetro type debe ser "daily" o "monthly".' });
    }
    // Para type=daily, la respuesta no cambia
    if (type === 'daily') {
        res.json({
            studentId,
            queryType: type,
            queryDate: date,
            records: detailedRecords,
        });
    }

  } catch (err) {
    console.error(`Error en GET /api/student/my-scores-summary (type: ${type}, date: ${date}):`, err);
    res.status(500).json({ message: 'Error interno del servidor al obtener el detalle de puntajes.' });
  } finally {
    client.release();
  }
});


// @route   GET /api/student/profile
// @desc    Get current student's full profile for editing
// @access  Private (Student)
router.get('/profile', async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const studentId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT id, full_name, nickname, email, phone, photo_url,
              age, birth_date,
              guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
              medical_conditions, comments,
              emergency_contact_name, emergency_contact_phone
       FROM students
       WHERE id = $1 AND is_active = TRUE`,
      [studentId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Perfil de estudiante no encontrado o inactivo.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching student profile:', err);
    res.status(500).json({ message: 'Error interno del servidor al obtener el perfil.' });
  }
});

// @route   PUT /api/student/profile
// @desc    Update current student's profile
// @access  Private (Student)
router.put('/profile', async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const studentId = req.user.id;
  const {
    nickname, email, phone, // 'phone' is used as 'celular'
    // Guardian data
    guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
    // Medical data
    medical_conditions,
    // Emergency contact
    emergency_contact_name, emergency_contact_phone,
    // comments // Student might not edit their own general comments field, usually by admin.
    // full_name, age, birth_date are typically not editable by student directly after registration.
  } = req.body;

  // Basic validation (example for email and phone)
  if (email && !/\S+@\S+\.\S+/.test(email)) {
    return res.status(400).json({ message: 'Por favor, introduce un email válido.' });
  }
  if (phone && !/^\d{9,15}$/.test(phone)) {
     return res.status(400).json({ message: 'El número de celular/teléfono debe tener entre 9 y 15 dígitos.' });
  }

  try {
    // Check if email is being changed and if it's already taken by another student
    const currentUser = await pool.query('SELECT email FROM students WHERE id = $1', [studentId]);
    if (currentUser.rows.length === 0) {
        return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }
    if (email && email !== currentUser.rows[0].email) {
      const emailCheck = await pool.query('SELECT id FROM students WHERE email = $1 AND id != $2', [email, studentId]);
      if (emailCheck.rows.length > 0) {
        return res.status(400).json({ message: 'El email ya está en uso por otra cuenta.' });
      }
    }

    const result = await pool.query(
      `UPDATE students
       SET nickname = $1, email = $2, phone = $3,
           guardian_full_name = $4, guardian_relationship = $5, guardian_phone = $6, guardian_email = $7,
           medical_conditions = $8,
           emergency_contact_name = $9, emergency_contact_phone = $10
       WHERE id = $11 AND is_active = TRUE
       RETURNING id, full_name, nickname, email, phone, photo_url, age, birth_date, guardian_full_name, guardian_relationship, guardian_phone, guardian_email, medical_conditions, comments, emergency_contact_name, emergency_contact_phone`,
      [
        nickname, email, phone,
        guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
        medical_conditions,
        emergency_contact_name, emergency_contact_phone,
        studentId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'No se pudo actualizar el perfil del estudiante (no encontrado o inactivo).' });
    }
    res.json({ message: 'Perfil actualizado exitosamente.', student: result.rows[0] });
  } catch (err) {
    console.error('Error updating student profile:', err);
    if (err.code === '23505' && err.constraint === 'students_email_key') {
        return res.status(400).json({ message: 'El email ya está en uso.' });
    }
    res.status(500).json({ message: 'Error interno del servidor al actualizar el perfil.' });
  }
});

// @route   PUT /api/student/password
// @desc    Change current student's password
// @access  Private (Student)
router.put('/password', async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const studentId = req.user.id;
  const { current_password, new_password, confirm_new_password } = req.body;

  if (!current_password || !new_password || !confirm_new_password) {
    return res.status(400).json({ message: 'Todos los campos de contraseña son requeridos.' });
  }
  if (new_password !== confirm_new_password) {
    return res.status(400).json({ message: 'La nueva contraseña y su confirmación no coinciden.' });
  }
  if (new_password.length < 6) { // Example minimum length
    return res.status(400).json({ message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const userResult = await pool.query('SELECT password_hash FROM students WHERE id = $1 AND is_active = TRUE', [studentId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'Estudiante no encontrado o inactivo.' });
    }

    const student = userResult.rows[0];
    const isMatch = await bcrypt.compare(current_password, student.password_hash);

    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta.' });
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(new_password, salt);

    await pool.query('UPDATE students SET password_hash = $1 WHERE id = $2', [newPasswordHash, studentId]);
    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (err) {
    console.error('Error changing student password:', err);
    res.status(500).json({ message: 'Error interno del servidor al cambiar la contraseña.' });
  }
});

// @route   GET /api/student/me/daily-quote
// @desc    Get or assign a daily inspirational quote for the authenticated student
// @access  Private (Student)
router.get('/me/daily-quote', async (req, res) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Acceso denegado.' });
  }
  const studentId = req.user.id;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

  const client = await pool.connect();
  try {
    // 1. Check student status and get name
    const studentResult = await client.query(
      'SELECT nickname, full_name, is_active FROM students WHERE id = $1',
      [studentId]
    );

    if (studentResult.rows.length === 0) {
      client.release();
      return res.status(404).json({ message: 'Estudiante no encontrado.' });
    }

    const student = studentResult.rows[0];
    if (!student.is_active) {
      client.release();
      return res.status(200).json({ quote: null, message: 'Estudiante inactivo, no se asignan frases.' });
    }

    const studentName = student.nickname || student.full_name.split(' ')[0]; // Use nickname or first name

    // 2. Check if a quote is already assigned for today
    const assignedQuoteResult = await client.query(
      `SELECT q.template
       FROM daily_student_quotes dsq
       JOIN quotes q ON dsq.quote_id = q.id
       WHERE dsq.student_id = $1 AND dsq.assigned_date = $2`,
      [studentId, today]
    );

    if (assignedQuoteResult.rows.length > 0) {
      // Quote already assigned for today
      const personalizedQuote = assignedQuoteResult.rows[0].template.replace('{name}', studentName);
      client.release();
      return res.json({ quote: personalizedQuote });
    } else {
      // No quote assigned for today, assign a new one
      // a. Select a random quote
      // Note: For very large quotes table, ORDER BY RANDOM() can be inefficient.
      // Consider other strategies like fetching all IDs and picking one in JS, or specific DB functions.
      // No quote assigned for today, implement new logic:
      // a. Get all quote IDs
      const allQuotesResult = await client.query('SELECT id, template FROM quotes');
      if (allQuotesResult.rows.length === 0) {
        client.release();
        return res.status(200).json({ quote: null, message: 'No hay frases inspiradoras disponibles.' }); // Changed to 200 with null quote
      }
      const allQuoteIds = allQuotesResult.rows.map(q => q.id);

      // b. Get quote IDs already seen by the student
      const seenQuotesResult = await client.query(
        'SELECT quote_id FROM daily_student_quotes WHERE student_id = $1',
        [studentId]
      );
      const seenQuoteIds = seenQuotesResult.rows.map(r => r.quote_id);

      // c. Determine available quotes
      let availableQuoteIds = allQuoteIds.filter(id => !seenQuoteIds.includes(id));
      let chosenQuote;

      // d. If no available quotes (student has seen all)
      if (availableQuoteIds.length === 0 && allQuoteIds.length > 0) { // Check allQuoteIds.length > 0 to avoid issues if quotes table is empty
        // e. Reset cycle: delete old quotes for this student
        await client.query('DELETE FROM daily_student_quotes WHERE student_id = $1', [studentId]);
        availableQuoteIds = allQuoteIds; // All quotes are now available again
      }

      // If still no available quotes (e.g., quotes table was empty initially)
      if (availableQuoteIds.length === 0) {
          client.release();
          return res.status(200).json({ quote: null, message: 'No hay frases inspiradoras disponibles para asignar.' });
      }

      // Select a random quote from available ones
      const randomAvailableIndex = Math.floor(Math.random() * availableQuoteIds.length);
      const chosenQuoteId = availableQuoteIds[randomAvailableIndex];

      // Find the chosen quote's template from the initially fetched allQuotesResult
      chosenQuote = allQuotesResult.rows.find(q => q.id === chosenQuoteId);

      if (!chosenQuote) { // Should not happen if availableQuoteIds is derived from allQuoteIds
          client.release();
          console.error(`Error: Chosen quote ID ${chosenQuoteId} not found in allQuotesResult.`);
          return res.status(500).json({ message: 'Error al seleccionar la frase del día.' });
      }

      // f. Create new record in daily_student_quotes
      await client.query(
        'INSERT INTO daily_student_quotes (student_id, quote_id, assigned_date) VALUES ($1, $2, $3)',
        [studentId, chosenQuote.id, today]
      );

      const personalizedQuote = chosenQuote.template.replace('{name}', studentName);
      client.release();
      return res.json({ quote: personalizedQuote });
    }
  } catch (err) {
    if (client) client.release();
    console.error('Error en GET /api/student/me/daily-quote:', err);
    res.status(500).json({ message: 'Error interno del servidor al obtener la frase del día.' });
  }
});


module.exports = router;
