import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

// Re-using styles from TeacherProfilePage for consistency, or define separately
const styles = {
  pageContainer: {
    maxWidth: '800px', // Slightly wider for potentially more fields
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
  textarea: { // Will be styled by .profile-form-input in App.css (shared class)
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #ccc',
    borderRadius: '4px',
    boxSizing: 'border-box',
    minHeight: '80px',
  },
  button: {
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--primary-color-student)', // Student theme color
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
  },
  gridContainer: { // For guardian, medical, emergency sections
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem'
  }
};


const StudentProfilePage = () => {
  const navigate = useNavigate();
  const API_BASE_URL = 'http://localhost:3001/api/student'; // Corrected API base
  const getToken = useCallback(() => localStorage.getItem('studentToken'), []);

  const initialProfileData = {
    full_name: '', // Display only, not editable by student
    nickname: '',
    email: '',
    phone: '', // Celular
    photo_url: '',
    age: '', // Display only
    birth_date: '', // Display only
    guardian_full_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_email: '',
    medical_conditions: '',
    // comments: '', // Usually not editable by student
    emergency_contact_name: '',
    emergency_contact_phone: ''
  };

  const [profile, setProfile] = useState(initialProfileData);
  const [initialFetchedProfile, setInitialFetchedProfile] = useState(initialProfileData);


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
          navigate('/estudiante/login');
          return;
        }
        // Corrected endpoint to /profile
        const response = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { 'x-auth-token': token }
        });
        // Ensure all fields in initialProfileData are present in response or set to default
        const fetchedData = { ...initialProfileData, ...response.data };
        setProfile(fetchedData);
        setInitialFetchedProfile(fetchedData); // Store initial fetched data
      } catch (err) {
        console.error("Error fetching student profile:", err);
        setProfileError(err.response?.data?.message || 'No se pudo cargar el perfil.');
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/estudiante/login');
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

    // Client-side validation (basic examples)
    if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
        setProfileError('Por favor, introduce un email válido.');
        setLoadingProfile(false);
        return;
    }
    if (profile.phone && !/^\d{9,15}$/.test(profile.phone)) {
        setProfileError('El número de celular debe tener entre 9 y 15 dígitos.');
        setLoadingProfile(false);
        return;
    }
    if (profile.guardian_phone && profile.guardian_phone.trim() !== '' && !/^\d{9,15}$/.test(profile.guardian_phone)) {
      setProfileError('El teléfono del apoderado debe tener entre 9 y 15 dígitos.');
      setLoadingProfile(false);
      return;
    }
    if (profile.emergency_contact_phone && profile.emergency_contact_phone.trim() !== '' && !/^\d{9,15}$/.test(profile.emergency_contact_phone)) {
      setProfileError('El teléfono de emergencia debe tener entre 9 y 15 dígitos.');
      setLoadingProfile(false);
      return;
    }
    if (profile.guardian_email && profile.guardian_email.trim() !== '' && !/\S+@\S+\.\S+/.test(profile.guardian_email)) {
        setProfileError('Por favor, introduce un email de apoderado válido.');
        setLoadingProfile(false);
        return;
    }

    // Only send editable fields
    const {
        nickname, email, phone,
        guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
        medical_conditions,
        emergency_contact_name, emergency_contact_phone
    } = profile;

    const updatePayload = {
        nickname, email, phone,
        guardian_full_name, guardian_relationship, guardian_phone, guardian_email,
        medical_conditions,
        emergency_contact_name, emergency_contact_phone
    };


    try {
      const token = getToken();
      // Corrected endpoint to /profile
      const response = await axios.put(`${API_BASE_URL}/profile`, updatePayload, {
        headers: { 'x-auth-token': token }
      });
      setProfileSuccess(response.data.message || 'Perfil actualizado exitosamente.');
      // Update profile with the response, which should include all fields
      const updatedData = { ...initialProfileData, ...response.data.student };
      setProfile(updatedData);
      setInitialFetchedProfile(updatedData); // Update initial fetched profile
    } catch (err) {
      console.error("Error updating student profile:", err);
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
      // Corrected endpoint to /password
      const response = await axios.put(`${API_BASE_URL}/password`, passwordData, {
        headers: { 'x-auth-token': token }
      });
      setPasswordSuccess(response.data.message || 'Contraseña actualizada exitosamente.');
      setPasswordData({ current_password: '', new_password: '', confirm_new_password: '' });
    } catch (err) {
      console.error("Error updating student password:", err);
      setPasswordError(err.response?.data?.message || 'Error al cambiar la contraseña.');
    } finally {
      setLoadingPassword(false);
    }
  };

  const profileHasChanged = JSON.stringify(profile) !== JSON.stringify(initialFetchedProfile);

  if (loadingProfile && !profile.id && !profile.full_name) { // Show loading only on initial full fetch
    return <div style={styles.pageContainer}><p>Cargando perfil...</p></div>;
  }

  return (
    <div style={styles.pageContainer}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Mi Perfil de Estudiante
      </h2>
      <p style={{textAlign: 'center', marginBottom: '2rem', fontSize: '1.2rem'}}>
        ¡Hola, {profile.nickname || profile.full_name || 'Estudiante'}!
      </p>

      <div style={styles.photoSection}>
        <img
          src={profile.photo_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'N A')}&background=4A4A7F&color=E0E0E0&size=128&font-size=0.5&bold=true`}
          alt="Foto de perfil"
          style={styles.profilePhoto}
        />
        <p style={{marginTop: '0.5rem', fontSize: '0.9em', color: '#666'}}>
          (Funcionalidad para cambiar foto próximamente)
        </p>
      </div>

      {/* Edit Profile Form */}
      <div style={styles.formSection}>
        <h3>Editar Información Personal y de Contacto</h3>
        {profileError && <p style={styles.errorMessage}>{profileError}</p>}
        {profileSuccess && <p style={styles.successMessage}>{profileSuccess}</p>}
        <form onSubmit={handleProfileSubmit}>
          {/* Non-editable fields for display */}
          <div style={styles.formGroup}>
            <label style={styles.label} className="profile-form-label">Nombre Completo (No editable):</label>
            <input type="text" value={profile.full_name || ''} style={{...styles.input, backgroundColor: '#f0f0f0'}} readOnly className="profile-form-input" />
          </div>
           <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
                <label style={styles.label} className="profile-form-label">ID Estudiante (No editable):</label>
                <input type="text" value={profile.id || ''} style={{...styles.input, backgroundColor: '#f0f0f0'}} readOnly className="profile-form-input" />
            </div>
            <div style={styles.formGroup}>
                <label style={styles.label} className="profile-form-label">Edad (No editable):</label>
                <input type="text" value={profile.age || ''} style={{...styles.input, backgroundColor: '#f0f0f0'}} readOnly className="profile-form-input" />
            </div>
          </div>


          <div style={styles.formGroup}>
            <label htmlFor="nickname" style={styles.label} className="profile-form-label">Sobrenombre (Nickname):</label>
            <input type="text" id="nickname" name="nickname" value={profile.nickname || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" />
          </div>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label} className="profile-form-label">Correo Electrónico:</label>
              <input type="email" id="email" name="email" value={profile.email || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" required />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="phone" style={styles.label} className="profile-form-label">Celular:</label>
              <input type="tel" id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos."/>
            </div>
          </div>

          <h4 style={{marginTop: '2rem', marginBottom: '1rem'}}>Datos del Apoderado</h4>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_full_name" style={styles.label} className="profile-form-label">Nombre Completo del Apoderado:</label>
              <input type="text" id="guardian_full_name" name="guardian_full_name" value={profile.guardian_full_name || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_relationship" style={styles.label} className="profile-form-label">Relación/Parentesco:</label>
              <input type="text" id="guardian_relationship" name="guardian_relationship" value={profile.guardian_relationship || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_phone" style={styles.label} className="profile-form-label">Teléfono del Apoderado:</label>
              <input type="tel" id="guardian_phone" name="guardian_phone" value={profile.guardian_phone || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos."/>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_email" style={styles.label} className="profile-form-label">Email del Apoderado:</label>
              <input type="email" id="guardian_email" name="guardian_email" value={profile.guardian_email || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" />
            </div>
          </div>

          <h4 style={{marginTop: '2rem', marginBottom: '1rem'}}>Datos Médicos y de Emergencia</h4>
          <div style={styles.formGroup}>
            <label htmlFor="medical_conditions" style={styles.label} className="profile-form-label">Condiciones Médicas Relevantes:</label>
            <textarea id="medical_conditions" name="medical_conditions" value={profile.medical_conditions || ''} onChange={handleProfileChange} style={styles.textarea} className="profile-form-input"></textarea>
          </div>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="emergency_contact_name" style={styles.label} className="profile-form-label">Nombre Contacto de Emergencia:</label>
              <input type="text" id="emergency_contact_name" name="emergency_contact_name" value={profile.emergency_contact_name || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="emergency_contact_phone" style={styles.label} className="profile-form-label">Teléfono Contacto de Emergencia:</label>
              <input type="tel" id="emergency_contact_phone" name="emergency_contact_phone" value={profile.emergency_contact_phone || ''} onChange={handleProfileChange} style={styles.input} className="profile-form-input" pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos."/>
            </div>
          </div>

          <button type="submit" style={{...styles.button, ...( (loadingProfile || !profileHasChanged) && styles.buttonDisabled)}} disabled={loadingProfile || !profileHasChanged}>
            {loadingProfile ? 'Guardando...' : 'Guardar Cambios de Perfil'}
          </button>
        </form>
      </div>

      {/* Change Password Form */}
      <div style={styles.formSection}>
        <h3>Cambiar Contraseña</h3>
        {passwordError && <p style={styles.errorMessage}>{passwordError}</p>}
        {passwordSuccess && <p style={styles.successMessage}>{passwordSuccess}</p>}
        <form onSubmit={handlePasswordSubmit}>
           <div style={styles.formGroup}>
            <label htmlFor="current_password_student" style={styles.label} className="profile-form-label">Contraseña Actual:</label>
            <input type="password" id="current_password_student" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} style={styles.input} className="profile-form-input" required />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="new_password_student" style={styles.label} className="profile-form-label">Nueva Contraseña:</label>
            <input type="password" id="new_password_student" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} style={styles.input} className="profile-form-input" required minLength="6"/>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="confirm_new_password_student" style={styles.label} className="profile-form-label">Confirmar Nueva Contraseña:</label>
            <input type="password" id="confirm_new_password_student" name="confirm_new_password" value={passwordData.confirm_new_password} onChange={handlePasswordChange} style={styles.input} className="profile-form-input" required minLength="6"/>
          </div>
          <button type="submit" style={{...styles.button, ...(loadingPassword && styles.buttonDisabled)}} disabled={loadingPassword}>
            {loadingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <Link to="/estudiante/dashboard" className="secondary-link">Volver al Panel</Link>
      </div>
    </div>
  );
};

export default StudentProfilePage;
