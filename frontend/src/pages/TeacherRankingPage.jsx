import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TrophyIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M15.28 4.72a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-1-1a.75.75 0 111.06-1.06l.47.47L14.22 4.72a.75.75 0 011.06 0zm-4.78 4.03a.75.75 0 01-1.06 0l-1-1a.75.75 0 111.06-1.06l.47.47 2.5-2.5a.75.75 0 011.06 1.06l-3 3.001zM5.78 8.72a.75.75 0 010-1.06l2.5-2.5a.75.75 0 011.06 0L11.28 7.1a.75.75 0 11-1.06 1.06l-.47-.47-2.5 2.5a.75.75 0 01-1.06 0zM2.5 13.25a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H3.25a.75.75 0 01-.75-.75zM3 15.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM2 18a.75.75 0 000 1.5h16a.75.75 0 000-1.5H2z" clipRule="evenodd" /></svg>;

const TeacherRankingPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchRanking = useCallback(async (monthToFetch) => {
    if (!monthToFetch) { setError('Por favor, seleccione un mes.'); setRankingData([]); return; }
    setLoading(true); setError('');
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/reports/monthly-ranking`, {
        params: { month: monthToFetch }, headers: { 'x-auth-token': token },
      });
      setRankingData(response.data.ranking || []);
    } catch (err) { console.error("Error fetching ranking:", err); setError(err.response?.data?.message || 'Error al cargar el ranking.'); setRankingData([]); }
    finally { setLoading(false); }
  }, [getToken, API_URL]);

  useEffect(() => { fetchRanking(selectedMonth); }, [fetchRanking, selectedMonth]);

  const handleFetchRanking = () => { fetchRanking(selectedMonth); };

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `${index + 1}.`;
  };

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Ranking Mensual de Estudiantes</h2>

      <div className="controls-section">
        <div className="controls-bar" style={{ justifyContent: 'center', gap: '1rem' }}>
          <div className="control-group">
            <label htmlFor="selectedMonthRanking">Mes:</label>
            <input
              type="month"
              id="selectedMonthRanking"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              required
            />
          </div>
          <button onClick={handleFetchRanking} disabled={loading} className="btn-action btn-teacher" style={{minWidth: 'auto'}}>
            <TrophyIcon /> {loading ? 'Cargando...' : 'Ver Ranking'}
          </button>
        </div>
      </div>

      {error && <div className="error-message-page">{error}</div>}

      {loading ? (
         <div className="text-center" style={{padding: "2rem"}}>Cargando ranking...</div>
      ) : (
        rankingData.length === 0 && !error ? (
          <div className="empty-table-message">No hay datos de ranking para el mes seleccionado.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th style={{width: '80px', textAlign: 'center'}}>#</th>
                  <th>Estudiante</th>
                  <th>Apodo</th>
                  <th style={{textAlign: 'right'}}>Puntaje Total</th>
                </tr>
              </thead>
              <tbody>
                {rankingData.map((student, index) => (
                  <tr key={student.student_id} className={index < 3 ? `rank-${index + 1}` : ''}>
                    <td className="ranking-position">
                      {getMedal(index)}
                    </td>
                    <td>{student.full_name}</td>
                    <td>{student.nickname || '-'}</td>
                    <td style={{textAlign: 'right'}}>
                        <strong>{student.grand_total_points}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default TeacherRankingPage;
