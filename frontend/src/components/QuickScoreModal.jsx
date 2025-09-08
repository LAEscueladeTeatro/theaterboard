import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import Spinner from './Spinner';

const QuickScoreModal = ({ student, date, onClose, onScoreSaved }) => {
    const [scoreType, setScoreType] = useState('PARTICIPACION');
    const [subCategory, setSubCategory] = useState('');
    const [points, setPoints] = useState('');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        let pointsToAssign = parseInt(points, 10);
        if (scoreType === 'PARTICIPACION') {
            if (subCategory === 'Participativo') pointsToAssign = 2;
            else if (subCategory === 'Apático') pointsToAssign = -1;
            else { toast.error("Seleccione el nivel de participación."); setIsSubmitting(false); return; }
        } else if (isNaN(pointsToAssign)) {
            toast.error("Ingrese un valor numérico para los puntos.");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            student_id: student.id,
            score_type: scoreType,
            score_date: date,
            points_assigned: pointsToAssign,
            sub_category: subCategory,
            notes,
        };

        try {
            const token = getToken();
            await axios.post(`${API_BASE_URL}/scores/personal`, payload, { headers: { 'x-auth-token': token } });
            toast.success(`Puntuación para ${student.full_name} registrada.`);
            if (onScoreSaved) onScoreSaved();
            onClose();
        } catch (err) {
            console.error("Error submitting quick score:", err);
            toast.error(err.response?.data?.message || 'No se pudo registrar la puntuación.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h3>Puntuación Rápida para {student.nickname || student.full_name}</h3>
                <p>Fecha: {date}</p>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="quickScoreType">Tipo de Puntuación:</label>
                        <select id="quickScoreType" value={scoreType} onChange={e => setScoreType(e.target.value)}>
                            <option value="PARTICIPACION">Participación</option>
                            <option value="CONDUCTA">Conducta</option>
                            <option value="USO_CELULAR">Uso de Celular</option>
                            <option value="EXTRA">Puntos Extra</option>
                        </select>
                    </div>

                    {scoreType === 'PARTICIPACION' && (
                        <div className="form-group">
                            <label>Nivel:</label>
                            <select value={subCategory} onChange={e => setSubCategory(e.target.value)} required>
                                <option value="">Seleccione nivel</option>
                                <option value="Participativo">Participativo (+2)</option>
                                <option value="Apático">Apático (-1)</option>
                            </select>
                        </div>
                    )}

                    {/* Simplified inputs for other types */}
                    {scoreType === 'CONDUCTA' && <div className="form-group"><label>Puntos:</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="-1, -2, -3" required /></div>}
                    {scoreType === 'USO_CELULAR' && <div className="form-group"><label>Puntos:</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="-1, -3" required /></div>}
                    {scoreType === 'EXTRA' && <div className="form-group"><label>Puntos:</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} placeholder="Ej: 5 o -2" required /></div>}

                    <div className="form-group">
                        <label>Notas (opcional):</label>
                        <input type="text" value={notes} onChange={e => setNotes(e.target.value)} />
                    </div>

                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary" disabled={isSubmitting}>Cancelar</button>
                        <button type="submit" className="btn-primary" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="20px" /> : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default QuickScoreModal;
