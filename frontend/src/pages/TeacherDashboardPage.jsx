import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ToggleSwitch from '../../components/ToggleSwitch'; // Ajustar ruta si es necesario

// Ícono para el botón Salir
const LogoutIcon = () => ( // Renombrado para claridad, era ArrowLeftOnRectangleIcon
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
    <path fillRule="evenodd" d="M3 3.25A2.25 2.25 0 015.25 1h5.5A2.25 2.25 0 0113 3.25V4.5a.75.75 0 01-1.5 0V3.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h5.5a.75.75 0 00.75-.75v-1.25a.75.75 0 011.5 0V16.75a2.25 2.25 0 01-2.25 2.25h-5.5A2.25 2.25 0 013 16.75V3.25zm10.97 9.22a.75.75 0 001.06-1.06l-1.72-1.72h3.44a.75.75 0 000-1.5H12.81l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3a.75.75 0 000 1.06l3 3z" clipRule="evenodd" />
  </svg>
);

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');

  const API_URL = 'http://localhost:3001/api/admin/settings';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  useEffect(() => {
    const fetchRegistrationStatus = async () => {
      setSettingsLoading(true);
      setSettingsError('');
      try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/registration-status`, {
          headers: { 'x-auth-token': token },
        });
        setIsRegistrationEnabled(response.data.enabled);
      } catch (err) {
        console.error("Error fetching registration status:", err);
        setSettingsError('No se pudo cargar el estado de las inscripciones.');
      } finally {
        setSettingsLoading(false);
      }
    };
    fetchRegistrationStatus();
  }, [getToken, API_URL]);

  const handleToggleRegistrationStatus = async () => {
    const newStatus = !isRegistrationEnabled;
    // Optimistic update
    // setIsRegistrationEnabled(newStatus);
    // O esperar al backend:
    setSettingsLoading(true); // Indicar carga durante la actualización
    setSettingsError('');

    try {
      const token = getToken();
      await axios.put(`${API_URL}/registration-status`,
        { enabled: newStatus },
        { headers: { 'x-auth-token': token } }
      );
      setIsRegistrationEnabled(newStatus); // Confirmar cambio
      alert(`Inscripciones públicas ${newStatus ? 'habilitadas' : 'deshabilitadas'}.`);
    } catch (err) {
      console.error("Error updating registration status:", err);
      // Revertir si fue optimista: setIsRegistrationEnabled(!newStatus);
      alert(`Error: ${err.response?.data?.message || 'No se pudo actualizar el estado.'}`);
      setSettingsError('Error al actualizar el estado.');
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    navigate('/docente/login');
  };

  return (
    <div className="dashboard-page-container">
      <div className="page-header-controls" style={{ justifyContent: 'flex-end', marginBottom: '1rem' }}>
         {/* Se quita el título h2 de aquí, se usa el de .dashboard-page-container h2 */}
      </div>
      <h2>Panel del Docente</h2>

      {/* Sección de Configuración de Inscripciones */}
      <div className="controls-section" style={{marginTop: '1rem', marginBottom: '2rem'}}>
        <h3 className="section-title">Ajustes de Inscripción</h3>
        {settingsLoading && <p className="text-center">Cargando configuración...</p>}
        {settingsError && <p className="error-message-page" style={{textAlign:'left', padding:'0.5rem 1rem', fontSize:'0.9rem'}}>{settingsError}</p>}
        {!settingsLoading && !settingsError && (
          <ToggleSwitch
            id="publicRegistrationToggle"
            label="Habilitar Inscripciones Públicas:"
            checked={isRegistrationEnabled}
            onChange={handleToggleRegistrationStatus}
            disabled={settingsLoading}
          />
        )}
         <p style={{fontSize: '0.85rem', color: 'var(--text-color-placeholder)', marginTop: '0.5rem'}}>
            Controla si los nuevos estudiantes pueden registrarse a través del formulario público.
          </p>
      </div>

      <div className="dashboard-actions-grid">
        <Link to="/docente/asistencia" className="dashboard-action-card">Registrar Asistencia</Link>
        <Link to="/docente/puntuaciones" className="dashboard-action-card">Registrar Puntuaciones</Link>
        <Link to="/docente/ingreso-historico" className="dashboard-action-card">Ingresar Registro Pasado</Link>
        <Link to="/docente/resumen" className="dashboard-action-card">Resumen de Puntos</Link>
        <Link to="/docente/ranking" className="dashboard-action-card">Ranking Mensual</Link>
        <Link to="/docente/lista-estudiantes" className="dashboard-action-card">Lista de Estudiantes</Link>
        <Link to="/docente/database" className="dashboard-action-card">Base de Datos Estudiantes</Link>
        {/* Futuro: Link a Mi Perfil Docente */}
        {/* <Link to="/docente/mi-perfil" className="dashboard-action-card">Mi Perfil</Link> */}
      </div>

      <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
        <button onClick={handleLogout} className="btn-logout">
          <LogoutIcon />
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
