import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Basic styling (can be moved to App.css or a dedicated CSS file)
const styles = {
  pageContainer: {
    maxWidth: '700px',
    margin: '2rem auto',
    padding: '2rem',
    border: '1px solid #ddd',
    borderRadius: '8px',
    backgroundColor: '#f9f9f9',
  },
  formSection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    border: '1px solid #eee',
    borderRadius: '8px',
    backgroundColor: '#fff',
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: { // Will be styled by .profile-form-label in App.css
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
  },
  input: { // Will be styled by .profile-form-input in App.css
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--primary-color-teacher)', // Corrected
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem',
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  errorMessage: {
    color: 'red',
    marginBottom: '1rem',
  },
  successMessage: {
    color: 'green',
    marginBottom: '1rem',
  },
  photoSection: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  profilePhoto: {
    width: '128px',
    height: '128px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '3px solid #ccc',
    backgroundColor: '#e0e0e0'
  }
};

const TeacherProfilePage = () => {
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:3001/api/teachers';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const [profile, setProfile] = useState({
    full_name: '',
    nickname: '',
    email: '',
    cellphone_number: '',
    photo_url: ''
  });
  const [initialProfile, setInitialProfile] = useState({});

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_new_password: ''
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoadingProfile(true);
      setProfileError('');
      try {
        const token = getToken();
        if (!token) {
          navigate('/docente/login');
          return;
        }
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { 'x-auth-token': token }
        });
        setProfile(response.data);
        setInitialProfile(response.data);
      } catch (err) {
        console.error("Error fetching teacher profile:", err);
        setProfileError(err.response?.data?.message || 'No se pudo cargar el perfil.');
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/docente/login');
        }
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, [getToken, navigate, API_BASE_URL]);

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
    setProfileSuccess('');
    setProfileError('');
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordSuccess('');
    setPasswordError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    if (!profile.full_name || !profile.email) {
        setProfileError('Nombre completo y email son requeridos.');
        setLoadingProfile(false);
        return;
    }
    if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
        setProfileError('Por favor, introduce un email válido.');
        setLoadingProfile(false);
        return;
    }
     if (profile.cellphone_number && profile.cellphone_number.trim() !== '' && !/^\d{9,15}$/.test(profile.cellphone_number)) {
        setProfileError('El número de celular debe tener entre 9 y 15 dígitos.');
        setLoadingProfile(false);
        return;
    }
    try {
      const token = getToken();
      const response = await axios.put(`${API_BASE_URL}/profile`, profile, {
        headers: { 'x-auth-token': token }
      });
      setProfileSuccess(response.data.message || 'Perfil actualizado exitosamente.');
      setProfile(response.data.teacher);
      setInitialProfile(response.data.teacher);
    } catch (err) {
      console.error("Error updating profile:", err);
      setProfileError(err.response?.data?.message || 'Error al actualizar el perfil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoadingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    if (passwordData.new_password !== passwordData.confirm_new_password) {
      setPasswordError('La nueva contraseña y su confirmación no coinciden.');
      setLoadingPassword(false);
      return;
    }
    if (passwordData.new_password.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
      setLoadingPassword(false);
      return;
    }
    try {
      const token = getToken();
      const response = await axios.put(`${API_BASE_URL}/password`, passwordData, {
        headers: { 'x-auth-token': token }
      });
      setPasswordSuccess(response.data.message || 'Contraseña actualizada exitosamente.');
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      console.error("Error updating password:", err);
      setPasswordError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const profileHasChanged = JSON.stringify(profile) !== JSON.stringify(initialProfile);

  if (loadingProfile && !profile.id) {
    return <div style={styles.pageContainer}><p>Cargando perfil...</p></div>;
  }

  return (
    <div style={styles.pageContainer}>
      <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>
        Mi Perfil - Hola, {profile.nickname || profile.full_name || 'Docente'}
      </h2>
      <div style={styles.photoSection}>
        <img
          src={profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'N A')}&background=2A2A3E&color=E0E0E0&size=128&font-size=0.5&bold=true`}
          alt="Foto de perfil"
          style={styles.profilePhoto}
        />
        <p style={{marginTop: '0.5rem', fontSize: '0.9em', color: '#666'}}>
          (Funcionalidad para cambiar foto próximamente)
        </p>
      </div>
      <div style={styles.formSection}>
        <h3>Editar Información Básica</h3>
        {profileError && <p style={styles.errorMessage}>{profileError}</p>}
        {profileSuccess && <p style={styles.successMessage}>{profileSuccess}</p>}
        <form onSubmit={handleProfileSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="full_name" style={styles.label} className="profile-form-label">Nombres Completos:</label>
            <input type="text" id="full_name" name="full_name" value={profile.full_name} onChange={handleProfileChange} style={styles.input} className="profile-form-input" required />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="nickname" style={styles.label} className="profile-form-label">Sobrenombre (Nickname):</label>
            <input type="text" id="nickname" name="nickname" value={profile.nickname} onChange={handleProfileChange} style={styles.input} className="profile-form-input" />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="email" style={styles.label} className="profile-form-label">Correo Electrónico:</label>
            <input type="email" id="email" name="email" value={profile.email} onChange={handleProfileChange} style={styles.input} className="profile-form-input" required />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="cellphone_number" style={styles.label} className="profile-form-label">Número de Celular:</label>
            <input type="tel" id="cellphone_number" name="cellphone_number" value={profile.cellphone_number || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos." />
          </div>
          <button type="submit" style={{...styles.button, backgroundColor: 'var(--primary-color-teacher)', ...( (loadingProfile || !profileHasChanged) && styles.buttonDisabled)}} disabled={loadingProfile || !profileHasChanged}>
            {loadingProfile ? 'Guardando...' : 'Guardar Cambios de Perfil'}
          </button>
        </form>
      </div>
      <div style={styles.formSection}>
        <h3>Cambiar Contraseña</h3>
        {passwordError && <p style={styles.errorMessage}>{passwordError}</p>}
        {passwordSuccess && <p style={styles.successMessage}>{passwordSuccess}</p>}
        <form onSubmit={handlePasswordSubmit}>
          <div style={styles.formGroup}>
            <label htmlFor="current_password" style={styles.label} className="profile-form-label">Contraseña Actual:</label>
            <input type="password" id="current_password" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} style={styles.input} className="profile-form-input" required />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="new_password" style={styles.label} className="profile-form-label">Nueva Contraseña:</label>
            <input type="password" id="new_password" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} style={styles.input} className="profile-form-input" required minLength="6" />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="confirm_new_password" style={styles.label} className="profile-form-label">Confirmar Nueva Contraseña:</label>
            <input type="password" id="confirm_new_password" name="confirm_new_password" value={passwordData.confirm_new_password} onChange={handlePasswordChange} style={styles.input} className="profile-form-input" required minLength="6" />
          </div>
          <button type="submit" style={{...styles.button, backgroundColor: 'var(--primary-color-teacher)', ...(loadingPassword && styles.buttonDisabled)}} disabled={loadingPassword}>
            {loadingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
       <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/docente/dashboard" className="secondary-link">Volver al Panel</Link>
      </div>
    </div>
  );
};

export default TeacherProfilePage;
