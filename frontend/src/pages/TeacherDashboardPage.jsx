import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import ToggleSwitch from '../components/ToggleSwitch';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast'; // Importar toast
import { API_BASE_URL } from '../config'; // Importar API_BASE_URL

const LogoutIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="18" height="18">
    <path fillRule="evenodd" d="M3 3.25A2.25 2.25 0 015.25 1h5.5A2.25 2.25 0 0113 3.25V4.5a.75.75 0 01-1.5 0V3.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v13.5a.75.75 0 00.75.75h5.5a.75.75 0 00.75-.75v-1.25a.75.75 0 011.5 0V16.75a2.25 2.25 0 01-2.25 2.25h-5.5A2.25 2.25 0 013 16.75V3.25zm10.97 9.22a.75.75 0 001.06-1.06l-1.72-1.72h3.44a.75.75 0 000-1.5H12.81l1.72-1.72a.75.75 0 00-1.06-1.06l-3 3a.75.75 0 000 1.06l3 3z" clipRule="evenodd" />
  </svg>
);

// Simpler, standard Settings Icon (Heroicon Cog-6-tooth style)
const SettingsIcon = ({ width = "28", height = "28" }) => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width={width} height={height}>
    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.532 1.532 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.532 1.532 0 01-.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106A1.532 1.532 0 0111.49 3.17zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
  </svg>
);

const TeacherDashboardPage = () => {
  const navigate = useNavigate();
  const [teacherProfile, setTeacherProfile] = useState({ full_name: '', nickname: '', photo_url: '' });
  const [profileLoading, setProfileLoading] = useState(true); // New state for profile loading
  const [profileLoadingError, setProfileLoadingError] = useState('');
  const [isRegistrationEnabled, setIsRegistrationEnabled] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState('');

  const LOCAL_ADMIN_API_URL = `${API_BASE_URL}/admin/settings`; // Usar API_BASE_URL
  const LOCAL_TEACHER_API_URL = `${API_BASE_URL}/teachers`; // Usar API_BASE_URL
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = getToken();
      if (!token) {
        navigate('/docente/login');
        return;
      }

      // Fetch Teacher Profile
      setProfileLoading(true);
      try {
        const profileResponse = await axios.get(`${LOCAL_TEACHER_API_URL}/profile`, { // Usar LOCAL_TEACHER_API_URL
          headers: { 'x-auth-token': token },
        });
        setTeacherProfile(profileResponse.data);
      } catch (err) {
        console.error("Error fetching teacher profile:", err);
        setProfileLoadingError('No se pudo cargar la información del perfil del docente.');
        if (err.response && (err.response.status === 401 || err.response.status === 403)) {
          navigate('/docente/login');
        }
      } finally {
        setProfileLoading(false); // Set profile loading to false
      }

      // Fetch Registration Status
      // setSettingsLoading(true); // This is already true by default, can be set here if preferred
      setSettingsError('');
      try {
        const response = await axios.get(`${LOCAL_ADMIN_API_URL}/registration-status`, { // Usar LOCAL_ADMIN_API_URL
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
  }, [getToken, navigate, LOCAL_ADMIN_API_URL, LOCAL_TEACHER_API_URL]); // Usar constantes locales

  const handleToggleRegistrationStatus = async () => {
    const newStatus = !isRegistrationEnabled;
    setSettingsLoading(true); // Indicar carga para el toggle
    setSettingsError('');

    try {
      const token = getToken();
      await axios.put(`${LOCAL_ADMIN_API_URL}/registration-status`, // Usar LOCAL_ADMIN_API_URL
        { enabled: newStatus },
        { headers: { 'x-auth-token': token } }
      );
      setIsRegistrationEnabled(newStatus);
      toast.success(`Inscripciones públicas ${newStatus ? 'habilitadas' : 'deshabilitadas'}.`);
    } catch (err) {
      console.error("Error updating registration status:", err);
      const errorMsg = err.response?.data?.message || 'No se pudo actualizar el estado.';
      toast.error(`Error: ${errorMsg}`);
      setSettingsError('Error al actualizar el estado.'); // Mantener error local si es necesario
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
        <Link to="/docente/mi-perfil" title="Ajustes" className="btn-settings">
          Ajustes
        </Link>
        <button onClick={handleLogout} className="btn-logout">
          <LogoutIcon />
          Salir
        </button>
      </div>

      {profileLoadingError && <p className="error-message-page">{profileLoadingError}</p>}
      {!profileLoadingError && teacherProfile.full_name && ( // Added check for teacherProfile.full_name to prevent rendering before data is fetched
        <div className="profile-card" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img
            src={teacherProfile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacherProfile.full_name || 'Docente')}&background=2A2A3E&color=E0E0E0&size=100&font-size=0.4&bold=true`}
            alt={`${teacherProfile.nickname || teacherProfile.full_name}`}
            className="profile-photo"
            style={{ width: '100px', height: '100px', borderRadius: '50%', border: '3px solid var(--primary-color-teacher)' }}
          />
          <div className="profile-info">
            <h2 style={{marginTop: 0, marginBottom: '0.25rem'}}>¡Hola, {teacherProfile.nickname || teacherProfile.full_name}!</h2>
            <p style={{fontSize: '1em', color: '#555', margin: 0}}>Rol: Docente</p>
          </div>
        </div>
      )}

      <div className="controls-section" style={{marginTop: '1rem', marginBottom: '2rem'}}>
        <h3 className="section-title">Ajustes de Inscripción</h3>
        {settingsLoading && !profileLoading && ( // Mostrar spinner solo si el perfil ya cargó, para no tener dos spinners grandes
          <div className="loading-container" style={{minHeight: '50px'}}>
            <Spinner size="30px" />
            <span style={{marginLeft: '10px'}}>Actualizando estado...</span>
          </div>
        )}
        {settingsError && <p className="error-message-page" style={{textAlign:'left', padding:'0.5rem 1rem', fontSize:'0.9rem'}}>{settingsError}</p>}
        {/* Mostrar el ToggleSwitch incluso si hay error, para que el usuario vea el estado actual antes del error */}
        {(!settingsLoading || settingsError) && ( // Mostrar toggle si no está cargando O si hubo un error (para ver el estado previo)
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
      </div>

      <p style={{textAlign: 'center', marginTop: '2.5rem', fontSize: '0.9rem', color: 'var(--text-color-main)'}}>
        Bienvenido al panel de control. Desde aquí podrás gestionar las actividades de la escuela.
      </p>
    </div>
  );
};

export default TeacherDashboardPage;
