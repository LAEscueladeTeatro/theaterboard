import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Icono para el botón
const ReportIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M15.992 2.012a.75.75 0 01.75.75v14.476a.75.75 0 01-1.28.53l-4.154-4.155a.75.75 0 00-1.06 0L5.53 17.773a.75.75 0 01-1.28-.531V2.762a.75.75 0 01.75-.75h10.992zM8.75 9.25a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;

const STATUS_DISPLAY_MAP_STUDENT = {
  PUNTUAL: { text: 'Puntual' }, A_TIEMPO: { text: 'A Tiempo' },
  TARDANZA_JUSTIFICADA: { text: 'Tardanza Justificada' }, TARDANZA_INJUSTIFICADA: { text: 'Tardanza Injustificada' },
  AUSENCIA_JUSTIFICADA: { text: 'Ausencia Justificada' }, AUSENCIA_INJUSTIFICADA: { text: 'Ausencia Injustificada' },
};

const StudentScoresDetailPage = () => {
  const [queryType, setQueryType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [scoreDetails, setScoreDetails] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';
  const getToken = useCallback(() => localStorage.getItem('studentToken'), []);

  // Efecto para obtener el nombre del estudiante una sola vez
  useEffect(() => {
    const fetchStudentName = async () => {
      const token = getToken();
      if (token) { // Solo intentar si hay token, la ruta de scores ya valida la sesión
        try {
          // Asumimos que la ruta /student/dashboard-data devuelve studentInfo.full_name
          // Esto es solo para obtener el nombre para el título, no es crítico si falla.
          const response = await axios.get(`${API_URL}/student/dashboard-data`, { headers: { 'x-auth-token': token } });
          if (response.data && response.data.studentInfo) {
            setStudentName(response.data.studentInfo.full_name);
          }
        } catch (err) {
          console.warn("No se pudo obtener el nombre del estudiante para el título.", err);
        }
      }
    };
    fetchStudentName();
  }, [getToken, API_URL]);


  const handleFetchScoreDetails = useCallback(async () => {
    setLoading(true); setError(''); setScoreDetails([]);
    const token = getToken();
    let dateParam = '';
    if (queryType === 'daily') {
      if (!selectedDate) { setError('Por favor, seleccione una fecha.'); setLoading(false); return; }
      dateParam = selectedDate;
    } else {
      if (!selectedMonth) { setError('Por favor, seleccione un mes.'); setLoading(false); return; }
      dateParam = selectedMonth;
    }
    try {
      const response = await axios.get(`${API_URL}/student/my-scores-summary`, {
        params: { type: queryType, date: dateParam }, headers: { 'x-auth-token': token },
      });
      setScoreDetails(response.data.records || []);
    } catch (err) { console.error("Error fetching score details:", err); setError(err.response?.data?.message || 'Error al cargar el detalle de puntajes.');}
    finally { setLoading(false); }
  }, [getToken, API_URL, queryType, selectedDate, selectedMonth]);

  // Cargar detalles iniciales al montar la página (para la fecha/mes por defecto)
  useEffect(() => {
    handleFetchScoreDetails();
  }, [handleFetchScoreDetails]);


  const formatDescription = (record) => {
    if (record.source === 'attendance') { return STATUS_DISPLAY_MAP_STUDENT[record.description]?.text || record.description; }
    if (record.record_type === 'Bono Madrugador') return 'Bono Madrugador';
    let desc = record.description.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    if (record.record_type && record.record_type !== record.description && !desc.toLowerCase().includes(record.record_type.toLowerCase())) {
      desc = `${record.record_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}: ${desc}`;
    }
    return desc;
  };

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/estudiante/dashboard" className="back-link">&larr; Volver a Mi Panel</Link>
      </div>
      <h2 className="page-title">Mis Puntajes Detallados {studentName && `de ${studentName}`}</h2>

      <div className="controls-section">
        <div className="controls-bar" style={{ justifyContent: 'center', gap: '1.5rem 2rem' }}>
          <div className="control-group">
            <label htmlFor="queryType">Ver por:</label>
            <select id="queryType" value={queryType} onChange={(e) => { setQueryType(e.target.value); setScoreDetails([]); setError('');}}>
              <option value="daily">Día</option>
              <option value="monthly">Mes</option>
            </select>
          </div>

          {queryType === 'daily' && (
            <div className="control-group">
              <label htmlFor="selectedDate">Fecha:</label>
              <input type="date" id="selectedDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
            </div>
          )}
          {queryType === 'monthly' && (
            <div className="control-group">
              <label htmlFor="selectedMonth">Mes:</label>
              <input type="month" id="selectedMonth" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required />
            </div>
          )}
          <button onClick={handleFetchScoreDetails} disabled={loading} className="btn-action btn-student" style={{minWidth: 'auto'}}>
            <ReportIcon/> {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>
      </div>

      {error && <div className="error-message-page">{error}</div>}

      {loading ? <div className="text-center" style={{padding: "2rem"}}>Cargando detalles...</div> : (
        scoreDetails.length === 0 && !error ? (
          <div className="empty-table-message">No hay registros de puntajes para la selección actual.</div>
        ) : (
          <div style={{overflowX: 'auto'}}>
            <table className="styled-table">
              <thead>
                <tr>
                  {queryType === 'monthly' && <th style={{textAlign: 'center'}}>Fecha Evento</th>}
                  <th>Tipo/Descripción</th>
                  <th style={{textAlign: 'center'}}>Puntos</th>
                  <th>Notas</th>
                  <th style={{textAlign: 'center'}}>Registrado En</th>
                </tr>
              </thead>
              <tbody>
                {scoreDetails.map((record, index) => (
                  <tr key={record.id || index}> {/* Usar record.id si está disponible y es único */}
                    {queryType === 'monthly' && <td style={{textAlign: 'center'}}>{new Date(record.attendance_date || record.recorded_at).toLocaleDateString('es-PE', {timeZone: 'UTC'})}</td>}
                    <td>{formatDescription(record)}</td>
                    <td className={record.points > 0 ? 'points-positive' : (record.points < 0 ? 'points-negative' : 'points-neutral')}>
                      {record.points > 0 ? `+${record.points}` : record.points}
                    </td>
                    <td>{record.notes || '-'}</td>
                    <td style={{textAlign: 'center'}}>{new Date(record.recorded_at).toLocaleString('es-PE', {timeZone: 'UTC', day: '2-digit', month: '2-digit', year: 'numeric', hour:'2-digit', minute:'2-digit'})}</td>
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

export default StudentScoresDetailPage;
