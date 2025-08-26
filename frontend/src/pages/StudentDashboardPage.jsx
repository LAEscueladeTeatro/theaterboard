import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { API_BASE_URL } from "../config";
import Spinner from '../components/Spinner'; // Importar Spinner

// Iconos SVG
const LogoutIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M3 3.25A2.25 2.25 0 015.25 1h5.5A2.25 2.25 0 0113 3.25V4.5a.75.75 0 01-1.5 0V3.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h5.5a.75.75 0 00.75-.75v-1.25a.75.75 0 011.5 0V16.75a2.25 2.25 0 01-2.25 2.25h-5.5A2.25 2.25 0 013 16.75V3.25zm10.97 9.22a.75.75 0 001.06-1.06l-1.72-1.72h3.44a.75.75 0 000-1.5H12.81l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3a.75.75 0 000 1.06l3 3z" clipRule="evenodd" /></svg>;
const ScoresIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path fillRule="evenodd" d="M4.5 3.75A.75.75 0 015.25 3h13.5a.75.75 0 01.75.75v16.5a.75.75 0 01-.75.75H5.25a.75.75 0 01-.75-.75V3.75zM9 6a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V6.75A.75.75 0 0115 6h.75a.75.75 0 01.75.75v3.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75V6.75A.75.75 0 019 6zm0 6.75a.75.75 0 01.75.75v.008c0 .414.336.75.75.75h3a.75.75 0 00.75-.75V13.5a.75.75 0 01.75-.75H15A.75.75 0 0115.75 12v3.75a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75V13.5a.75.75 0 01.75-.75z" clipRule="evenodd" /></svg>;

const SettingsIcon = ({ width = "28", height = "28" }) => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width={width} height={height}>
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const StudentDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dailyQuote, setDailyQuote] = useState('');
  const [quoteError, setQuoteError] = useState('');
  const navigate = useNavigate();

  const getToken = useCallback(() => localStorage.getItem('studentToken'), []);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setError("No autenticado. Redirigiendo a login...");
      setTimeout(() => navigate('/estudiante/login'), 2000);
      setLoading(false);
      return;
    }

    const fetchDashboardData = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await axios.get(`${API_BASE_URL}/student/dashboard-data`, {
          headers: { 'x-auth-token': token },
        });
        setDashboardData(response.data);

        // Fetch daily quote only if student is active (studentInfo is part of dashboardData)
        if (response.data && response.data.studentInfo && response.data.studentInfo.is_active !== false) { // Check explicitly for false if is_active can be undefined initially
          fetchDailyQuote(token);
        }

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

    const fetchDailyQuote = async (token) => {
      setQuoteError('');
      try {
        const quoteResponse = await axios.get(`${API_BASE_URL}/student/me/daily-quote`, {
          headers: { 'x-auth-token': token },
        });
        if (quoteResponse.data && quoteResponse.data.quote) {
          setDailyQuote(quoteResponse.data.quote);
        }
      } catch (err) {
        console.error("Error fetching daily quote:", err);
        setQuoteError(err.response?.data?.message || 'No se pudo cargar la frase del día.');
      }
    };

    fetchDashboardData();
  }, [getToken, navigate, API_BASE_URL]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/estudiante/login');
  };

  const getRankingDisplay = (position, month) => {
    if (position === null || position === undefined) {
      return { icon: '❓', message: 'Tu posición en el ranking no está disponible actualmente.' };
    }
    let icon = '';
    if (position === 1) icon = '🥇';
    else if (position === 2) icon = '🥈';
    else if (position === 3) icon = '🥉';
    else if (position > 3 && position <=10) icon = '⭐';

    let motivationalMessage = '';
    if (position >= 1 && position <= 3) motivationalMessage = `¡Felicidades! Estás en el Top 3. ¡Sigue brillando!`;
    else if (position > 3 && position <= 10) motivationalMessage = `¡Gran esfuerzo! Estás entre los mejores 10.`;
    else if (position > 10 && position <= 20) motivationalMessage = `Vas por buen camino. ¡Un poco más de esfuerzo y subirás!`;
    else motivationalMessage = `Presta atención a tus puntos para mejorar.`;

    return { icon, message: motivationalMessage, positionText: `${icon} N° ${position}`.trim() };
  };


  if (loading) {
    return (
      <div className="dashboard-page-container student-dashboard loading-container">
        <Spinner />
      </div>
    );
  }
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
      <div className="page-header-controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <Link to="/estudiante/mi-perfil" title="Ajustes" className="btn-settings">
          Ajustes
        </Link>
        <button onClick={handleLogout} className="btn-logout">
          <LogoutIcon /> Salir
        </button>
      </div>

      {studentInfo && ( // Ensure studentInfo is available before rendering profile card
        <div className="profile-card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <img
            src={studentInfo.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentInfo.full_name || 'N A')}&background=4A4A7F&color=E0E0E0&size=100&font-size=0.4&bold=true`}
            alt={`${studentInfo.nickname || studentInfo.id}`}
            className="profile-photo"
            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
          />
          <div className="profile-info">
            <h2 style={{marginTop: 0, marginBottom: '0.25rem'}}>¡Bienvenido/a, {studentInfo.nickname || studentInfo.full_name}!</h2>
            <p style={{margin: '0 0 0.25rem 0'}}><strong>ID:</strong> {studentInfo.id}</p>
            {rankingPosition !== null && rankingPosition !== undefined && (
              <p style={{margin: 0}}><strong>Ranking ({currentMonth}):</strong> {rankingInfo.positionText}</p>
            )}
          </div>
        </div>
      )}

      {/* Daily Inspirational Quote Section */}
      {quoteError && <p className="error-message-page" style={{textAlign: 'center', marginTop: '1rem'}}>{quoteError}</p>}
      {dailyQuote && !quoteError && (
        <div style={{
          backgroundColor: 'var(--container-background-lighter, rgba(50, 50, 70, 0.85))', // Darker than main container bg
          padding: '1.5rem',
          borderRadius: 'var(--border-radius-medium, 12px)',
          marginBottom: '2rem',
          textAlign: 'center',
          borderLeft: `5px solid var(--primary-color-student, #3498DB)`,
          boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
        }}>
          <h5 style={{
            fontSize: '0.9rem',
            color: 'var(--text-color-placeholder, #a0a0a0)',
            marginBottom: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '1px'
          }}>
            Y RECUERDA:
          </h5>
          <p style={{
            fontSize: '1.15rem',
            color: 'var(--text-color-light, #FFFFFF)',
            fontStyle: 'italic',
            margin: 0,
            lineHeight: '1.6'
          }}>
            "{dailyQuote}"
          </p>
        </div>
      )}

      {dashboardData && ( // Ensure dashboardData is available for summary card
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
      )}

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
