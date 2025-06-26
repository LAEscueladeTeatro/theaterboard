import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TeacherDashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    navigate('/docente/login');
  };

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
        <button onClick={handleLogout} className="dashboard-action-card button-as-card">
          Salir
        </button>
      </div>
      <p style={{textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-color-main)'}}>
        Bienvenido al panel de control. Desde aquí podrás gestionar las actividades de la escuela.
      </p>
    </div>
  );
};

export default TeacherDashboardPage;
