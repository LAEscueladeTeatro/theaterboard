import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ToggleSwitch from '../components/ToggleSwitch'; // Ruta Corregida

// Ícono para el botón Salir
const LogoutIcon = () => ( // Renombrado para claridad, era ArrowLeftOnRectangleIcon
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
    <path fillRule="evenodd" d="M3 3.25A2.25 2.25 0 015.25 1h5.5A2.25 2.25 0 0113 3.25V4.5a.75.75 0 01-1.5 0V3.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h5.5a.75.75 0 00.75-.75v-1.25a.75.75 0 011.5 0V16.75a2.25 2.25 0 01-2.25 2.25h-5.5A2.25 2.25 0 013 16.75V3.25zm10.97 9.22a.75.75 0 001.06-1.06l-1.72-1.72h3.44a.75.75 0 000-1.5H12.81l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3a.75.75 0 000 1.06l3 3z" clipRule="evenodd" />
  </svg>
);

const GearIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const [teacherProfile, setTeacherProfile] = useState({ full_name: '', nickname: '', photo_url: '' });
  const [profileLoadingError, setProfileLoadingError] = useState('');
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');

  const ADMIN_API_URL = 'http://localhost:3001/api/admin/settings';
  const TEACHER_API_URL = 'http://localhost:3001/api/teachers';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/docente/login');
        return;
      }

      // Fetch Teacher Profile
      try {
        const profileResponse = await axios.get(`${TEACHER_API_URL}/profile`, {
          headers: { 'x-auth-token': token },
        });
        setTeacherProfile(profileResponse.data);
      } catch (err) {
        console.error("Error fetching teacher profile:", err);
        setProfileLoadingError('No se pudo cargar la información del perfil del docente.');
        // Potentially navigate away if critical, or just show error
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate('/docente/login');
        }
      }

      // Fetch Registration Status
      setSettingsLoading(true);
      setSettingsError('');
      try {
        const response = await axios.get(`${ADMIN_API_URL}/registration-status`, {
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

    fetchDashboardData();
  }, [getToken, navigate, ADMIN_API_URL, TEACHER_API_URL]);

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
      <div className="page-header-controls" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '1rem', gap: '1rem' }}>
        <Link to="/docente/mi-perfil" title="Mi Perfil" className="icon-link" style={{ textDecoration: 'none', color: 'var(--text-color-main)' }}>
          <GearIcon />
        </Link>
        <button onClick={handleLogout} className="btn-logout">
          <LogoutIcon />
          Salir
        </button>
      </div>

      {/* Teacher Profile Card */}
      {profileLoadingError && <p className="error-message-page">{profileLoadingError}</p>}
      {!profileLoadingError && (
        <div className="profile-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img
            src={teacherProfile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherProfile.full_name || 'Docente')}&background=2A2A3E&color=E0E0E0&size=100&font-size=0.4&bold=true`}
            alt={`${teacherProfile.nickname || teacherProfile.full_name}`}
            className="profile-photo"
            style={{ width: '100px', height: '100px', borderRadius: '50%' }}
          />
          <div className="profile-info">
            <h2 style={{marginTop: 0, marginBottom: '0.25rem'}}>¡Hola, {teacherProfile.nickname || teacherProfile.full_name || 'Docente'}!</h2>
            <p style={{fontSize: '1em', color: '#555', margin: 0}}>Rol: Docente</p>
          </div>
        </div>
      )}

      {/* <h2>Panel de Control del Docente</h2> Eliminar o ajustar, ya que el saludo está arriba */}

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
        {/* <Link to="/docente/mi-perfil" className="dashboard-action-card">Mi Perfil</Link> ELIMINADO */}
      </div>

      {/* Botón Salir movido al page-header-controls */}
      {/* <div style={{ textAlign: 'center', marginTop: '2.5rem', marginBottom: '1rem' }}>
        <button onClick={handleLogout} className="btn-logout">
          <LogoutIcon />
          Salir
        </button>
      </div> */}
      <p style={{textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-color-main)'}}>
        Bienvenido al panel de control. Desde aquí podrás gestionar las actividades de la escuela.
      </p>
    </div>
  );
};

export default TeacherDashboardPage;
