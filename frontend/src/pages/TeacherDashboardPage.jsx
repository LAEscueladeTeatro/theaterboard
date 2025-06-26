import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TeacherDashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    navigate('/docente/login');
  };

  // Ícono para el botón Salir
  const ArrowLeftOnRectangleIcon = () => (
    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
      <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm4.06-1.06a.75.75 0 000 1.06l1.72 1.72H6.75a.75.75 0 000 1.5h6.53l-1.72 1.72a.75.75 0 001.06 1.06l3-3a.75.75 0 000-1.06l-3-3a.75.75 0 00-1.06 0z" clipRule="evenodd" />
    </svg>
  );

  return (
    <div className="dashboard-page-container">
      <h2>Panel del Docente</h2>
      <div className="dashboard-actions-grid">
        <Link to="/docente/asistencia" className="dashboard-action-card">Registrar Asistencia</Link>
        <Link to="/docente/puntuaciones" className="dashboard-action-card">Registrar Puntuaciones</Link>
        <Link to="/docente/ingreso-historico" className="dashboard-action-card">Ingresar Registro Pasado</Link>
        <Link to="/docente/resumen" className="dashboard-action-card">Resumen de Puntos</Link>
        <Link to="/docente/ranking" className="dashboard-action-card">Ranking Mensual</Link>
        <Link to="/docente/lista-estudiantes" className="dashboard-action-card">Lista de Estudiantes</Link>
        <Link to="/docente/database" className="dashboard-action-card">Base de Datos Estudiantes</Link>
        {/* Añadir más acciones aquí si es necesario */}
      </div>
      <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
        <button onClick={handleLogout} className="btn-logout">
          <ArrowLeftOnRectangleIcon />
          Salir
        </button>
      </div>
      <p style={{textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-color-main)'}}>
        Bienvenido al panel de control. Desde aquí podrás gestionar las actividades de la escuela.
      </p>
    </div>
  );
};

export default TeacherDashboardPage;
