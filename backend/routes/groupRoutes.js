const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const authMiddleware = require('../middleware/authMiddleware');

// @route   GET /api/groups
// @desc    Get all student groups
// @access  Private (Teacher)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM groups ORDER BY group_id ASC');
        res.json(rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
