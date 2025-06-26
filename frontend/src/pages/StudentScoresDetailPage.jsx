import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Reutilizar el mapa de estados de asistencia para mostrar descripciones amigables si es necesario
const STATUS_DISPLAY_MAP_STUDENT = {
  PUNTUAL: { text: 'Puntual' },
  A_TIEMPO: { text: 'A Tiempo' },
  TARDANZA_JUSTIFICADA: { text: 'Tardanza Justificada' },
  TARDANZA_INJUSTIFICADA: { text: 'Tardanza Injustificada' },
  AUSENCIA_JUSTIFICADA: { text: 'Ausencia Justificada' },
  AUSENCIA_INJUSTIFICADA: { text: 'Ausencia Injustificada' },
};


const StudentScoresDetailPage = () => {
  const [queryType, setQueryType] = useState('daily'); // 'daily' o 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const [scoreDetails, setScoreDetails] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = 'http://localhost:3001/api';
  const getToken = useCallback(() => localStorage.getItem('studentToken'), []);

  const handleFetchScoreDetails = async () => {
    setLoading(true);
    setError('');
    setScoreDetails([]);
    const token = getToken();

    let dateParam = '';
    if (queryType === 'daily') {
      if (!selectedDate) {
        setError('Por favor, seleccione una fecha.');
        setLoading(false);
        return;
      }
      dateParam = selectedDate;
    } else { // monthly
      if (!selectedMonth) {
        setError('Por favor, seleccione un mes.');
        setLoading(false);
        return;
      }
      dateParam = selectedMonth;
    }

    try {
      const response = await axios.get(`${API_URL}/student/my-scores-summary`, {
        params: { type: queryType, date: dateParam },
        headers: { 'x-auth-token': token },
      });
      setScoreDetails(response.data.records || []);
    } catch (err) {
      console.error("Error fetching score details:", err);
      setError(err.response?.data?.message || 'Error al cargar el detalle de puntajes.');
    } finally {
      setLoading(false);
    }
  };

  // Formatear la descripción para que sea más legible
  const formatDescription = (record) => {
    if (record.source === 'attendance') {
      return STATUS_DISPLAY_MAP_STUDENT[record.description]?.text || record.description;
    }
    if (record.record_type === 'Bono Madrugador') return 'Bono Madrugador';
    // Para scores, puede ser score_type o sub_category
    let desc = record.description.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    if (record.record_type && record.record_type !== record.description && !desc.toLowerCase().includes(record.record_type.toLowerCase())) {
      desc = `${record.record_type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}: ${desc}`;
    }
    return desc;
  };

  return (
    <div>
      <h2>Mis Puntajes Detallados</h2>
      <p><Link to="/estudiante/dashboard">Volver al Panel</Link></p>

      <div style={{ margin: '20px 0' }}>
        <label htmlFor="queryType">Tipo de Consulta: </label>
        <select id="queryType" value={queryType} onChange={(e) => { setQueryType(e.target.value); setScoreDetails([]); setError('');}}>
          <option value="daily">Diaria</option>
          <option value="monthly">Mensual</option>
        </select>

        {queryType === 'daily' && (
          <span style={{ marginLeft: '10px' }}>
            <label htmlFor="selectedDate">Fecha: </label>
            <input type="date" id="selectedDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
          </span>
        )}
        {queryType === 'monthly' && (
          <span style={{ marginLeft: '10px' }}>
            <label htmlFor="selectedMonth">Mes: </label>
            <input type="month" id="selectedMonth" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} required />
          </span>
        )}
        <button onClick={handleFetchScoreDetails} disabled={loading} style={{marginLeft: '10px'}}>
          {loading ? 'Consultando...' : 'Consultar Puntajes'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginTop: '15px' }}>Error: {error}</p>}

      {loading ? <p>Cargando detalles...</p> : (
        scoreDetails.length === 0 && !error ? <p>No hay registros de puntajes para la selección.</p> : (
          <table border="1" style={{width: '100%', marginTop: '20px', borderCollapse: 'collapse'}}>
            <thead>
              <tr>
                {queryType === 'monthly' && <th>Fecha Evento</th>}
                <th>Tipo/Descripción</th>
                <th>Puntos</th>
                <th>Notas</th>
                <th>Registrado En</th>
              </tr>
            </thead>
            <tbody>
              {scoreDetails.map((record, index) => (
                <tr key={index}> {/* Usar un ID más robusto si el backend lo provee por registro */}
                  {queryType === 'monthly' && <td>{new Date(record.attendance_date || record.recorded_at).toLocaleDateString('es-PE')}</td>}
                  <td>{formatDescription(record)}</td>
                  <td style={{color: record.points >= 0 ? 'green' : 'red', textAlign: 'center'}}>{record.points > 0 ? `+${record.points}` : record.points}</td>
                  <td>{record.notes || '-'}</td>
                  <td>{new Date(record.recorded_at).toLocaleString('es-PE')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default StudentScoresDetailPage;
