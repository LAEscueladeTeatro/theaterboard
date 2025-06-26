import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TeacherSummaryPage = () => {
  const [summaryType, setSummaryType] = useState('student_monthly'); // 'student_monthly' o 'daily_all'
  const [students, setStudents] = useState([]); // Para el selector de estudiante
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  // Cargar lista de estudiantes para el selector
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/students`, { headers: { 'x-auth-token': token } });
        setStudents(response.data);
        if (response.data.length > 0) {
          // setSelectedStudent(response.data[0].id); // Opcional: seleccionar el primero por defecto
        }
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err.response?.data?.message || 'Error al cargar estudiantes.');
      }
    };
    fetchStudents();
  }, [getToken]);

  const handleFetchSummary = async () => {
    setLoading(true);
    setError('');
    setSummaryData(null);
    const token = getToken();
    const headers = { 'x-auth-token': token };

    try {
      let response;
      if (summaryType === 'student_monthly') {
        if (!selectedStudent || !selectedMonth) {
          setError('Por favor, seleccione un estudiante y un mes.');
          setLoading(false);
          return;
        }
        response = await axios.get(`${API_URL}/reports/student-summary`, {
          params: { studentId: selectedStudent, month: selectedMonth },
          headers,
        });
      } else { // daily_all
        if (!selectedDate) {
          setError('Por favor, seleccione una fecha.');
          setLoading(false);
          return;
        }
        response = await axios.get(`${API_URL}/reports/daily-summary`, {
          params: { date: selectedDate },
          headers,
        });
      }
      setSummaryData(response.data);
    } catch (err) {
      console.error("Error fetching summary:", err);
      setError(err.response?.data?.message || 'Error al cargar el resumen.');
    } finally {
      setLoading(false);
    }
  };

  const renderStudentMonthlySummary = () => {
    if (!summaryData || summaryType !== 'student_monthly' || !summaryData.summary) return null;
    const { studentInfo, month, summary } = summaryData;
    return (
      <div>
        <h4>Resumen Mensual para: {studentInfo.full_name} ({studentInfo.nickname}) - Mes: {month}</h4>
        <p><strong>Puntos Totales de Asistencia:</strong> {summary.totalAttendancePoints}</p>
        <p><strong>Puntos Totales de Bono Madrugador:</strong> {summary.totalBonusPoints}</p>
        <p><strong>Puntos Totales Adicionales (Scores):</strong> {summary.totalAdditionalScores}</p>
        <ul>
          {Object.entries(summary.detailedScores || {}).map(([type, points]) => (
            <li key={type}>{type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}: {points}</li>
          ))}
        </ul>
        <p><strong>GRAN TOTAL DE PUNTOS: {summary.grandTotalPoints}</strong></p>
      </div>
    );
  };

  const renderDailyAllSummary = () => {
    if (!summaryData || summaryType !== 'daily_all' || !summaryData.dailySummary) return null;
    const { date, dailySummary } = summaryData;
    return (
      <div>
        <h4>Resumen Diario para Todos los Estudiantes - Fecha: {date}</h4>
        {dailySummary.length === 0 ? <p>No hay datos para esta fecha.</p> : (
          <table border="1" style={{width: '100%', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                <th>Estudiante</th>
                <th>Asistencia Pts</th>
                <th>Bono Pts</th>
                <th>Scores Pts</th>
                <th>Total Día</th>
              </tr>
            </thead>
            <tbody>
              {dailySummary.map(item => (
                <tr key={item.student_id}>
                  <td>{item.full_name} ({item.nickname || item.student_id})</td>
                  <td>{item.total_attendance_points}</td>
                  <td>{item.total_bonus_points}</td>
                  <td>{item.total_additional_scores}</td>
                  <td><strong>{item.grand_total_points}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    );
  };


  return (
    <div>
      <h2>Resumen de Asistencia y Puntuaciones</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>

      <div style={{ margin: '20px 0' }}>
        <label htmlFor="summaryType">Tipo de Resumen: </label>
        <select id="summaryType" value={summaryType} onChange={(e) => { setSummaryType(e.target.value); setSummaryData(null); setError(''); }}>
          <option value="student_monthly">Por Estudiante (Mensual)</option>
          <option value="daily_all">Diario (Todos los Estudiantes)</option>
        </select>
      </div>

      {summaryType === 'student_monthly' && (
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="selectedStudent">Estudiante: </label>
          <select id="selectedStudent" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
            <option value="">-- Seleccione Estudiante --</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
          <label htmlFor="selectedMonth" style={{ marginLeft: '10px' }}>Mes: </label>
          <input type="month" id="selectedMonth" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required />
        </div>
      )}

      {summaryType === 'daily_all' && (
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="selectedDate">Fecha: </label>
          <input type="date" id="selectedDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
        </div>
      )}

      <button onClick={handleFetchSummary} disabled={loading}>
        {loading ? 'Cargando...' : 'Generar Resumen'}
      </button>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>Error: {error}</p>}

      <div style={{ marginTop: '20px' }}>
        {summaryType === 'student_monthly' && renderStudentMonthlySummary()}
        {summaryType === 'daily_all' && renderDailyAllSummary()}
      </div>
    </div>
  );
};

export default TeacherSummaryPage;
