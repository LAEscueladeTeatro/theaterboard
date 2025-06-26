import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TeacherRankingPage = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchRanking = useCallback(async (monthToFetch) => {
    if (!monthToFetch) {
      setError('Por favor, seleccione un mes.');
      setRankingData([]);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}/reports/monthly-ranking`, {
        params: { month: monthToFetch },
        headers: { 'x-auth-token': token },
      });
      setRankingData(response.data.ranking || []);
    } catch (err) {
      console.error("Error fetching ranking:", err);
      setError(err.response?.data?.message || 'Error al cargar el ranking.');
      setRankingData([]);
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL]);

  // Cargar ranking inicial para el mes actual o el seleccionado
  useEffect(() => {
    fetchRanking(selectedMonth);
  }, [fetchRanking, selectedMonth]);

  const handleFetchRanking = () => {
    fetchRanking(selectedMonth);
  };

  return (
    <div>
      <h2>Ranking Mensual de Estudiantes</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>

      <div style={{ margin: '20px 0' }}>
        <label htmlFor="selectedMonth">Mes: </label>
        <input
          type="month"
          id="selectedMonth"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          required
        />
        <button onClick={handleFetchRanking} disabled={loading} style={{marginLeft: '10px'}}>
          {loading ? 'Cargando...' : 'Ver Ranking'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>Error: {error}</p>}

      {loading ? <p>Cargando ranking...</p> : (
        rankingData.length === 0 && !error ? <p>No hay datos de ranking para el mes seleccionado.</p> : (
          <table border="1" style={{width: '80%', marginTop: '20px', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th>#</th>
                <th>Estudiante</th>
                <th>Apodo</th>
                <th>Puntaje Total del Mes</th>
                {/* Opcional: Desglose de puntos si se devuelve desde el backend */}
                {/* <th>Asistencia</th> */}
                {/* <th>Bonos</th> */}
                {/* <th>Scores</th> */}
              </tr>
            </thead>
            <tbody>
              {rankingData.map((student, index) => (
                <tr key={student.student_id}>
                  <td>{index + 1}</td>
                  <td>{student.full_name}</td>
                  <td>{student.nickname}</td>
                  <td><strong>{student.grand_total_points}</strong></td>
                  {/* Renderizar desglose si está disponible */}
                  {/* <td>{student.total_attendance_points}</td> */}
                  {/* <td>{student.total_bonus_points}</td> */}
                  {/* <td>{student.total_additional_scores}</td> */}
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default TeacherRankingPage;
