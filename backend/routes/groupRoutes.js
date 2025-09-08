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

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private (Teacher)
router.post('/', authMiddleware, async (req, res) => {
    const { name, schedule_description } = req.body;
    if (!name) {
        return res.status(400).json({ message: 'El nombre del grupo es requerido.' });
    }

    try {
        const { rows } = await pool.query(
            'INSERT INTO groups (name, schedule_description) VALUES ($1, $2) RETURNING *',
            [name, schedule_description || '']
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        console.error('Error creating group:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/groups/:id
// @desc    Update a group
// @access  Private (Teacher)
router.put('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { name, schedule_description } = req.body;

    if (!name) {
        return res.status(400).json({ message: 'El nombre del grupo es requerido.' });
    }

    try {
        const { rows } = await pool.query(
            'UPDATE groups SET name = $1, schedule_description = $2 WHERE group_id = $3 RETURNING *',
            [name, schedule_description || '', id]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        res.json(rows[0]);
    } catch (err) {
        console.error('Error updating group:', err.message);
        res.status(500).send('Server error');
    }
});

// @route   DELETE /api/groups/:id
// @desc    Delete a group
// @access  Private (Teacher)
router.delete('/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        // La constraint ON DELETE SET NULL en la tabla students se encargará de los estudiantes.
        const result = await pool.query('DELETE FROM groups WHERE group_id = $1', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Grupo no encontrado.' });
        }

        res.json({ message: 'Grupo eliminado exitosamente.' });
    } catch (err) {
        console.error('Error deleting group:', err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
