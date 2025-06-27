import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Icono para el botón
const ReportIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M15.992 2.012a.75.75 0 01.75.75v14.476a.75.75 0 01-1.28.53l-4.154-4.155a.75.75 0 00-1.06 0L5.53 17.773a.75.75 0 01-1.28-.531V2.762a.75.75 0 01.75-.75h10.992zM8.75 9.25a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;


const TeacherSummaryPage = () => {
  const [summaryType, setSummaryType] = useState('student_monthly');
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/admin/students?active=true`, { headers: { 'x-auth-token': token } });
        setStudents(response.data);
      } catch (err) { console.error("Error fetching students:", err); setError(err.response?.data?.message || 'Error al cargar estudiantes.'); }
    };
    fetchStudents();
  }, [getToken, API_URL]);

  const handleFetchSummary = async () => {
    setLoading(true); setError(''); setSummaryData(null);
    const token = getToken(); const headers = { 'x-auth-token': token };
    try {
      let response;
      if (summaryType === 'student_monthly') {
        if (!selectedStudent || !selectedMonth) { setError('Por favor, seleccione un estudiante y un mes.'); setLoading(false); return; }
        response = await axios.get(`${API_URL}/reports/student-summary`, { params: { studentId: selectedStudent, month: selectedMonth }, headers });
      } else {
        if (!selectedDate) { setError('Por favor, seleccione una fecha.'); setLoading(false); return; }
        response = await axios.get(`${API_URL}/reports/daily-summary`, { params: { date: selectedDate }, headers });
      }
      setSummaryData(response.data);
    } catch (err) { console.error("Error fetching summary:", err); setError(err.response?.data?.message || 'Error al cargar el resumen.'); }
    finally { setLoading(false); }
  };

  const renderStudentMonthlySummary = () => {
    if (!summaryData || summaryType !== 'student_monthly' || !summaryData.summary) return null;
    const { studentInfo, month, summary } = summaryData;
    const formattedMonth = month ? new Date(month + '-02').toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'N/A';

    return (
      <div className="summary-detail-card"> {/* Nueva clase para la tarjeta de detalle */}
        <h4 className="section-title">Resumen Mensual para: {studentInfo.full_name} ({studentInfo.nickname || studentInfo.id})</h4>
        <p style={{textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.1rem'}}>Mes: <strong>{formattedMonth}</strong></p>

        <p><strong>Puntos Totales de Asistencia:</strong> {summary.totalAttendancePoints}</p>
        <p><strong>Puntos Totales de Bono Madrugador:</strong> {summary.totalBonusPoints}</p>
        <p><strong>Puntos Totales Adicionales (Scores):</strong> {summary.totalAdditionalScores}</p>
        {Object.keys(summary.detailedScores || {}).length > 0 && (
            <>
                <p style={{marginTop: '1rem'}}><strong>Detalle de Scores Adicionales:</strong></p>
                <ul>
                {Object.entries(summary.detailedScores).map(([type, points]) => (
                    <li key={type}><span>{type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}:</span> <span>{points} pts</span></li>
                ))}
                </ul>
            </>
        )}
        <p className="grand-total">GRAN TOTAL DE PUNTOS: {summary.grandTotalPoints}</p>
      </div>
    );
  };

  const renderDailyAllSummary = () => {
    if (!summaryData || summaryType !== 'daily_all' || !summaryData.dailySummary) return null;
    const { date, dailySummary } = summaryData;
    const formattedDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC'}) : 'N/A';

    return (
      <div>
        <h4 className="section-title" style={{textAlign:'center'}}>Resumen Diario para Todos - Fecha: {formattedDate}</h4>
        {dailySummary.length === 0 ? <div className="empty-table-message" style={{marginTop: '1rem'}}>No hay datos de puntuación para esta fecha.</div> : (
          <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Asistencia</th>
                  <th>Bono</th>
                  <th>Scores Adic.</th>
                  <th>Total del Día</th>
                </tr>
              </thead>
              <tbody>
                {dailySummary.map(item => (
                  <tr key={item.student_id}>
                    <td>{item.full_name} ({item.nickname || item.student_id})</td>
                    <td style={{textAlign: 'center'}}>{item.total_attendance_points}</td>
                    <td style={{textAlign: 'center'}}>{item.total_bonus_points}</td>
                    <td style={{textAlign: 'center'}}>{item.total_additional_scores}</td>
                    <td style={{textAlign: 'center'}}><strong>{item.grand_total_points}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Resumen de Puntos</h2>

      <div className="controls-section">
        <div className="controls-bar" style={{justifyContent: 'center', gap: '1.5rem 2rem'}}> {/* Centrar controles y ajustar gap */}
          <div className="control-group">
            <label htmlFor="summaryType">Tipo de Resumen:</label>
            <select id="summaryType" value={summaryType} onChange={(e) => { setSummaryType(e.target.value); setSummaryData(null); setError(''); }}>
              <option value="student_monthly">Por Estudiante (Mensual)</option>
              <option value="daily_all">Diario (Todos los Estudiantes)</option>
            </select>
          </div>

          {summaryType === 'student_monthly' && (
            <>
              <div className="control-group">
                <label htmlFor="selectedStudent">Estudiante:</label>
                <select id="selectedStudent" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required={summaryType === 'student_monthly'}>
                  <option value="">-- Seleccione Estudiante --</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                </select>
              </div>
              <div className="control-group">
                <label htmlFor="selectedMonth">Mes:</label>
                <input type="month" id="selectedMonth" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required={summaryType === 'student_monthly'} />
              </div>
            </>
          )}

          {summaryType === 'daily_all' && (
            <div className="control-group">
              <label htmlFor="selectedDate">Fecha:</label>
              <input type="date" id="selectedDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required={summaryType === 'daily_all'} />
            </div>
          )}
           <button onClick={handleFetchSummary} disabled={loading} className="btn-action btn-teacher" style={{minWidth: 'auto'}}>
             <ReportIcon /> {loading ? 'Cargando...' : 'Generar Resumen'}
           </button>
        </div>
      </div>

      {error && <div className="error-message-page">{error}</div>}

      {loading && !summaryData && <p className="text-center" style={{padding: '2rem'}}>Generando resumen...</p>}

      {summaryData && (
        <div className="summary-results-container">
          {summaryType === 'student_monthly' && renderStudentMonthlySummary()}
          {summaryType === 'daily_all' && renderDailyAllSummary()}
        </div>
      )}
    </div>
  );
};

export default TeacherSummaryPage;
