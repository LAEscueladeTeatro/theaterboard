import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

// Iconos SVG
const LogoutIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M3 3.25A2.25 2.25 0 015.25 1h5.5A2.25 2.25 0 0113 3.25V4.5a.75.75 0 01-1.5 0V3.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h5.5a.75.75 0 00.75-.75v-1.25a.75.75 0 011.5 0V16.75a2.25 2.25 0 01-2.25 2.25h-5.5A2.25 2.25 0 013 16.75V3.25zm10.97 9.22a.75.75 0 001.06-1.06l-1.72-1.72h3.44a.75.75 0 000-1.5H12.81l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3a.75.75 0 000 1.06l3 3z" clipRule="evenodd" /></svg>;
const ScoresIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M4.5 3.75A.75.75 0 015.25 3h13.5a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V3.75zM9 6a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V6.75A.75.75 0 0115 6h.75a.75.75 0 01.75.75v3.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75V6.75A.75.75 0 019 6zm0 6.75a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V13.5a.75.75 0 01.75-.75H15A.75.75 0 0115.75 12v3.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75V13.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;


const StudentDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3001/api';

  const getToken = useCallback(() => localStorage.getItem('studentToken'), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      const token = getToken();

      if (!token) {
        setError("No autenticado. Redirigiendo a login...");
        setTimeout(() => navigate('/estudiante/login'), 2000);
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_URL}/student/dashboard-data`, {
          headers: { 'x-auth-token': token },
        });
        setDashboardData(response.data);
      } catch (err) {
        console.error("Error fetching student dashboard data:", err);
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          localStorage.removeItem('studentToken');
          setError("Sesión inválida o expirada. Redirigiendo a login...");
          setTimeout(() => navigate('/estudiante/login'), 2000);
        } else {
          setError(err.response?.data?.message || 'Error al cargar datos del panel.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [getToken, navigate, API_URL]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/estudiante/login');
  };

  // Mover getRankingMessageAndIcon fuera para que no se recree en cada render
  // y hacerla una función pura que toma rankingPosition como argumento.
  const getRankingDisplay = (position, month) => {
    if (position === null || position === undefined) {
      return { icon: '❓', message: 'Tu posición en el ranking no está disponible actualmente.' };
    }
    let icon = '';
    if (position === 1) icon = '🥇';
    else if (position === 2) icon = '🥈';
    else if (position === 3) icon = '🥉';
    else if (position > 3 && position <=10) icon = '⭐';

    let message = `Puesto N° ${position} en ${month}. `;
    if (position >= 1 && position <= 3) message += `¡Felicidades! Estás en el Top 3. ¡Sigue brillando!`;
    else if (position > 3 && position <= 10) message += `¡Gran esfuerzo! Estás entre los mejores 10.`;
    else if (position > 10 && position <= 20) message += `Vas por buen camino. ¡Un poco más de esfuerzo y subirás!`;
    else message += `Presta atención a tus puntos para mejorar.`;

    return { icon, message, positionText: `${icon} N° ${position}`.trim() };
  };


  if (loading) return <div className="dashboard-page-container student-dashboard"><p className="text-center" style={{padding: '2rem'}}>Cargando tu panel...</p></div>;
  if (error) return <div className="dashboard-page-container student-dashboard"><div className="error-message-page">{error}</div> <div style={{textAlign:'center', marginTop:'1rem'}}><Link to="/" className="btn-action btn-student">Volver al Inicio</Link></div></div>;
  if (!dashboardData) return <div className="dashboard-page-container student-dashboard"><p className="empty-table-message">No se pudieron cargar los datos de tu panel.</p></div>;

  const { studentInfo, currentMonth, monthlyTotalPoints, castingStatus, rankingPosition } = dashboardData;
  const rankingInfo = getRankingDisplay(rankingPosition, currentMonth);


  const getCastingStatusClassName = () => {
    if (castingStatus === 'APTO') return 'casting-status-apto';
    if (castingStatus === 'EN EVALUACIÓN') return 'casting-status-evaluacion';
    return 'casting-status-no-apto';
  };

  return (
    <div className="dashboard-page-container student-dashboard">
      <div className="page-header-controls" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <button onClick={handleLogout} className="btn-logout">
          <LogoutIcon /> Salir
        </button>
      </div>
      <h2 className="page-title" style={{marginBottom: '2rem'}}>Panel del Estudiante</h2>

      <div className="profile-card">
        <img
          src={studentInfo.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentInfo.full_name || 'N A')}&background=2A2A3E&color=E0E0E0&size=128&font-size=0.5&bold=true`}
          alt={`${studentInfo.nickname || studentInfo.id}`}
          className="profile-photo"
        />
        <div className="profile-info">
          <h3>¡Bienvenido/a, {studentInfo.nickname || studentInfo.full_name}!</h3>
          <p><strong>ID:</strong> {studentInfo.id}</p>
          {rankingPosition !== null && rankingPosition !== undefined && (
            <p><strong>Ranking ({currentMonth}):</strong> {rankingInfo.positionText}</p>
          )}
        </div>
      </div>

      <div className="summary-info-card">
        <h4 className="section-title">Resumen del Mes ({currentMonth})</h4>
        <p><strong>Puntaje Total del Mes:</strong> <span style={{fontSize: '1.3em', color: 'var(--primary-color-student)', fontWeight: 'bold'}}>{monthlyTotalPoints !== null ? monthlyTotalPoints : 'N/A'}</span> puntos</p>
        <p>
          <strong>Estado de Acceso a Casting: </strong>
          <span className={getCastingStatusClassName()}>
            {castingStatus || 'No disponible'}
          </span>
        </p>
        <p style={{marginTop: '1rem'}}>
          <strong>Feedback del Ranking:</strong> {rankingInfo.message}
        </p>
      </div>

      <div className="dashboard-actions-grid" style={{marginTop: '1.5rem'}}>
        <Link to="/estudiante/mis-puntajes" className="dashboard-action-card">
          <ScoresIcon /> Ver Mis Puntajes Detallados
        </Link>
      </div>
       <div style={{textAlign: 'center', marginTop: '2.5rem'}}>
            <Link to="/" className="secondary-link">Ir a la Página de Inicio</Link>
       </div>
    </div>
  );
};

export default StudentDashboardPage;
