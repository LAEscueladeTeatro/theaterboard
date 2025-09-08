const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// Middleware to ensure only teachers can access these routes
router.use(authMiddleware);

/**
 * @route   DELETE /api/admin-actions/student-records
 * @desc    Delete all records for a specific student for a given month
 * @access  Private (Teacher)
 * @body    { studentId: "ET001", month: "YYYY-MM" }
 */
router.delete('/student-records', async (req, res) => {
    const { studentId, month } = req.body;

    if (!studentId || !month) {
        return res.status(400).json({ message: 'studentId y month (YYYY-MM) son requeridos.' });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: 'El formato de month debe ser YYYY-MM.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const year = month.split('-')[0];
        const monthNum = month.split('-')[1];

        // Delete from attendance_records
        await client.query(
            `DELETE FROM attendance_records WHERE student_id = $1 AND EXTRACT(YEAR FROM attendance_date) = $2 AND EXTRACT(MONTH FROM attendance_date) = $3`,
            [studentId, year, monthNum]
        );

        // Delete from score_records
        await client.query(
            `DELETE FROM score_records WHERE student_id = $1 AND EXTRACT(YEAR FROM score_date) = $2 AND EXTRACT(MONTH FROM score_date) = $3`,
            [studentId, year, monthNum]
        );

        // Delete from daily_bonus_log
        await client.query(
            `DELETE FROM daily_bonus_log WHERE student_id = $1 AND EXTRACT(YEAR FROM bonus_date) = $2 AND EXTRACT(MONTH FROM bonus_date) = $3`,
            [studentId, year, monthNum]
        );

        await client.query('COMMIT');
        res.json({ message: `Todos los registros para el estudiante ${studentId} en el mes ${month} han sido eliminados.` });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting student records:', err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar los registros.' });
    } finally {
        client.release();
    }
});

/**
 * @route   DELETE /api/admin-actions/monthly-records
 * @desc    Delete all records for all students for a given month
 * @access  Private (Teacher)
 * @body    { month: "YYYY-MM" }
 */
router.delete('/monthly-records', async (req, res) => {
    const { month } = req.body;

    if (!month) {
        return res.status(400).json({ message: 'El parámetro month (YYYY-MM) es requerido.' });
    }

    if (!/^\d{4}-\d{2}$/.test(month)) {
        return res.status(400).json({ message: 'El formato de month debe ser YYYY-MM.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const year = month.split('-')[0];
        const monthNum = month.split('-')[1];

        // Delete from attendance_records for all students
        await client.query(
            `DELETE FROM attendance_records WHERE EXTRACT(YEAR FROM attendance_date) = $1 AND EXTRACT(MONTH FROM attendance_date) = $2`,
            [year, monthNum]
        );

        // Delete from score_records for all students
        await client.query(
            `DELETE FROM score_records WHERE EXTRACT(YEAR FROM score_date) = $1 AND EXTRACT(MONTH FROM score_date) = $2`,
            [year, monthNum]
        );

        // Delete from daily_bonus_log for all students
        await client.query(
            `DELETE FROM daily_bonus_log WHERE EXTRACT(YEAR FROM bonus_date) = $1 AND EXTRACT(MONTH FROM bonus_date) = $2`,
            [year, monthNum]
        );

        await client.query('COMMIT');
        res.json({ message: `Todos los registros del mes ${month} han sido eliminados para todos los estudiantes.` });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error deleting monthly records:', err);
        res.status(500).json({ message: 'Error interno del servidor al eliminar los registros del mes.' });
    } finally {
        client.release();
    }
});

module.exports = router;
