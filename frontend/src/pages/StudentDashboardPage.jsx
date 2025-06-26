import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

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
          localStorage.removeItem('studentToken'); // Token inválido o no autorizado
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
  }, [getToken, navigate]);

  const handleLogout = () => {
    localStorage.removeItem('studentToken');
    navigate('/estudiante/login');
  };

  if (loading) return <p>Cargando panel del estudiante...</p>;
  if (error) return <p style={{ color: 'red' }}>Error: {error}</p>;
  if (!dashboardData) return <p>No se pudieron cargar los datos del panel.</p>;

  const { studentInfo, currentMonth, monthlyTotalPoints, castingStatus, rankingPosition } = dashboardData;

  const getRankingMessageAndIcon = () => {
    if (rankingPosition === null || rankingPosition === undefined) {
      return { icon: '❓', message: 'Tu posición en el ranking no está disponible actualmente.' };
    }
    if (rankingPosition >= 1 && rankingPosition <= 3) {
      let icon = '🏆';
      if (rankingPosition === 1) icon = '🥇';
      if (rankingPosition === 2) icon = '🥈';
      if (rankingPosition === 3) icon = '🥉';
      return { icon, message: `¡Felicidades! Estás en el Top 3 (Puesto N° ${rankingPosition}). ¡Sigue brillando!` };
    }
    if (rankingPosition > 3 && rankingPosition <= 10) {
      return { icon: '⭐', message: `¡Gran esfuerzo! Estás entre los mejores 10 (Puesto N° ${rankingPosition}).` };
    }
    if (rankingPosition > 10 && rankingPosition <= 20) {
      return { icon: '', message: `Vas por buen camino (Puesto N° ${rankingPosition}). ¡Un poco más de esfuerzo y subirás!` };
    }
    return { icon: '', message: `Estás en el Puesto N° ${rankingPosition}. Presta atención a tus puntos para mejorar.` };
  };

  const rankingInfo = getRankingMessageAndIcon();

  return (
    <div>
      <h2>Panel del Estudiante</h2>
      <button onClick={handleLogout} style={{ float: 'right' }}>Salir</button>
      <Link to="/">Volver al Inicio</Link>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h3>Bienvenido/a, {studentInfo.full_name}!</h3>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src={studentInfo.photo_url || 'https://via.placeholder.com/150?text=Foto'}
            alt={`${studentInfo.nickname || studentInfo.id}`}
            style={{ width: '100px', height: '100px', borderRadius: '50%', marginRight: '20px', objectFit: 'cover' }}
          />
          <div>
            <p><strong>ID:</strong> {studentInfo.id}</p>
            <p><strong>Apodo:</strong> {studentInfo.nickname || 'N/A'}</p>
            {rankingPosition !== null && rankingPosition !== undefined && (
              <p><strong>Puesto en Ranking ({currentMonth}):</strong> {rankingInfo.icon} N° {rankingPosition}</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '20px', border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
        <h4>Resumen del Mes ({currentMonth})</h4>
        <p><strong>Puntaje Total del Mes:</strong> {monthlyTotalPoints} puntos</p>
        <p>
          <strong>Estado de Acceso a Casting: </strong>
          <span style={{ fontWeight: 'bold', color: castingStatus === 'APTO' ? 'green' : (castingStatus === 'EN EVALUACIÓN' ? 'orange' : 'red') }}>
            {castingStatus}
          </span>
        </p>
        <p>
          {/* Mensaje motivacional sin el número de puesto explícito aquí, ya que está arriba */}
          <strong>Feedback del Ranking:</strong> {rankingInfo.message.replace(/\(Puesto N° \d+\)/g, '').trim()}
        </p>
        <p><Link to="/estudiante/mis-puntajes">Ver Mis Puntajes Detallados</Link></p>
      </div>

      {/* Aquí se podrían añadir más secciones, como un historial de puntos, etc. */}
    </div>
  );
};

export default StudentDashboardPage;
