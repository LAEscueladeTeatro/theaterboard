import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from "../config"; // Importar config
import Spinner from '../components/Spinner'; // Importar Spinner
import * as faceapi from 'face-api.js';

// Re-using styles from TeacherProfilePage for consistency, or define separately
const styles = {
  pageContainer: {
    maxWidth: '800px', // Slightly wider for potentially more fields
    margin: '2rem auto',
    padding: '2rem',
    // backgroundColor: '#f9f9f9', // Removed to allow dark background inheritance/setting
    border: '1px solid var(--border-color-subtle, #4A4A60)', // Use theme border color
    borderRadius: '8px',
  },
  formSection: {
    marginBottom: '2rem',
    padding: '1.5rem',
    border: '1px solid var(--border-color-subtle, #4A4A60)', // Use theme border color
    borderRadius: '8px',
    backgroundColor: 'var(--container-background, rgba(30, 30, 50, 0.75))', // Dark container background
  },
  formGroup: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    marginBottom: '0.5rem',
    fontWeight: 'bold',
    color: 'var(--text-color-main, #E0E0E0)', // Light text for labels
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--border-color-subtle, #4A4A60)', // Theme border
    borderRadius: '4px',
    boxSizing: 'border-box',
    backgroundColor: 'var(--input-background, #2A2A3E)', // Dark input background
    color: 'var(--text-color-main, #E0E0E0)', // Light text for inputs
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid var(--border-color-subtle, #4A4A60)', // Theme border
    borderRadius: '4px',
    boxSizing: 'border-box',
    minHeight: '80px',
    backgroundColor: 'var(--input-background, #2A2A3E)', // Dark input background
    color: 'var(--text-color-main, #E0E0E0)', // Light text for inputs
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
    backgroundColor: 'var(--input-background-disabled, #3a3a5c)', // Consistent dark disabled background
    color: 'var(--text-color-placeholder, #888890)',    // Consistent light disabled text
    cursor: 'not-allowed',
    border: '1px solid var(--border-color-subtle, #4A4A60)', // Optional: add border like active inputs
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
  const STUDENT_API_URL = `${API_BASE_URL}/student`; // Usar constante importada
  const getToken = useCallback(() => localStorage.getItem('studentToken'), []);

  const [isFaceModalOpen, setIsFaceModalOpen] = useState(false);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [faceError, setFaceError] = useState('');
  const [faceSuccess, setFaceSuccess] = useState('');
  const videoRef = React.useRef();
  const canvasRef = React.useRef();
  const [captureStep, setCaptureStep] = useState(0); // 0: inactivo, 1: frente, 2: izq, 3: der, 4: preview
  const [collectedDescriptors, setCollectedDescriptors] = useState([]);
  const [videoDevices, setVideoDevices] = useState([]);
  const [activeDeviceIndex, setActiveDeviceIndex] = useState(0);

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

  const [loadingProfile, setLoadingProfile] = useState(true); // Para carga inicial
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false); // Para spinner de actualización de perfil
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
        const response = await axios.get(`${STUDENT_API_URL}/profile`, { // Usar STUDENT_API_URL
          headers: { 'x-auth-token': token }
        });
        const fetchedData = { ...initialProfileData, ...response.data };
        setProfile(fetchedData);
        setInitialFetchedProfile(fetchedData);
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
  }, [getToken, navigate, STUDENT_API_URL]); // Usar STUDENT_API_URL

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
    setIsUpdatingProfile(true); // Usar nuevo estado para actualización
    setProfileError('');
    setProfileSuccess('');

    // Client-side validation (basic examples)
    if (profile.email && !/\S+@\S+\.\S+/.test(profile.email)) {
        setProfileError('Por favor, introduce un email válido.');
        setIsUpdatingProfile(false);
        return;
    }
    if (profile.phone && profile.phone.trim() !== '' && !/^\d{9,15}$/.test(profile.phone)) {
        setProfileError('El número de celular debe tener entre 9 y 15 dígitos.');
        setIsUpdatingProfile(false);
        return;
    }
    if (profile.guardian_phone && profile.guardian_phone.trim() !== '' && !/^\d{9,15}$/.test(profile.guardian_phone)) {
      setProfileError('El teléfono del apoderado debe tener entre 9 y 15 dígitos.');
      setIsUpdatingProfile(false);
      return;
    }
    if (profile.emergency_contact_phone && profile.emergency_contact_phone.trim() !== '' && !/^\d{9,15}$/.test(profile.emergency_contact_phone)) {
      setProfileError('El teléfono de emergencia debe tener entre 9 y 15 dígitos.');
      setIsUpdatingProfile(false);
      return;
    }
    if (profile.guardian_email && profile.guardian_email.trim() !== '' && !/\S+@\S+\.\S+/.test(profile.guardian_email)) {
        setProfileError('Por favor, introduce un email de apoderado válido.');
        setIsUpdatingProfile(false);
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
      const response = await axios.put(`${STUDENT_API_URL}/profile`, updatePayload, { // Usar STUDENT_API_URL
        headers: { 'x-auth-token': token }
      });
      setProfileSuccess(response.data.message || 'Perfil actualizado exitosamente.');
      // Update profile with the response, which should include all fields
      const updatedData = { ...initialProfileData, ...response.data.student };
      setProfile(updatedData);
      setInitialFetchedProfile(updatedData);
    } catch (err) {
      console.error("Error updating student profile:", err);
      setProfileError(err.response?.data?.message || 'Error al actualizar el perfil.');
    } finally {
      setIsUpdatingProfile(false); // Usar nuevo estado
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
      const response = await axios.put(`${STUDENT_API_URL}/password`, passwordData, { // Usar STUDENT_API_URL
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

  // ===== LÓGICA PARA REGISTRO FACIAL =====
  // Cargar los modelos de face-api.js
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = '/models'; // Asume que los modelos están en public/models
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        setFaceApiLoaded(true);
      } catch (error) {
        console.error("Error loading face-api models", error);
        setFaceError("No se pudieron cargar las herramientas de IA. Inténtalo de nuevo.");
      }
    };
    loadModels();
  }, []);
  // Este useEffect se encargará de reiniciar el video cuando cambie la cámara seleccionada.
  useEffect(() => {
    if (isFaceModalOpen && videoDevices.length > 0) {
      startVideo();
    }
    // Cleanup: Detener el video cuando el modal se cierra o el componente se desmonta
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isFaceModalOpen, activeDeviceIndex, videoDevices, startVideo]);

  const startVideo = useCallback(async () => {
    if (videoDevices.length === 0) {
      console.log("No video devices found yet, startVideo will wait.");
      return;
    }
    const constraints = {
      video: {
        deviceId: { exact: videoDevices[activeDeviceIndex].deviceId }
      }
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera", err);
      setFaceError("No se pudo acceder a la cámara. Revisa los permisos en tu navegador.");
    }
  }, [videoDevices, activeDeviceIndex]);

  const handleOpenFaceModal = async () => {
    if (!faceApiLoaded) return;
    setFaceError('');
    setFaceSuccess('');

    // 1. Obtener dispositivos
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setVideoDevices(cameras);
      console.log('Cámaras detectadas:', cameras.length, cameras);
      setActiveDeviceIndex(0); // Empezar con la primera cámara

      // 2. Resetear estado y abrir modal
      setCaptureStep(1);
      setCollectedDescriptors([]);
      setIsFaceModalOpen(true);

      // 3. Iniciar video (se llamará automáticamente por el useEffect)
    } catch (err) {
      console.error("Error enumerating devices:", err);
      setFaceError("No se pudo obtener la lista de cámaras.");
    }
  };

  const handleCloseFaceModal = () => {
    setIsFaceModalOpen(false);
    setCaptureStep(0); // Resetear
    setCollectedDescriptors([]);
    // The useEffect cleanup will handle stopping the video stream
  };

  const handleCameraChange = () => {
    setActiveDeviceIndex(prevIndex => (prevIndex + 1) % videoDevices.length);
  };

  const handleRestartCapture = () => {
    setCollectedDescriptors([]);
    setCaptureStep(1);
    setFaceError('');
    setFaceSuccess('');
    startVideo();
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsCapturing(true);
    setFaceError('');

    const detections = await faceapi.detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detections) {
      setFaceError("No se detectó rostro. Inténtalo de nuevo.");
      setIsCapturing(false);
      return;
    }

    const newDescriptors = [...collectedDescriptors, Array.from(detections.descriptor)];
    setCollectedDescriptors(newDescriptors);

    if (captureStep < 3) {
      setCaptureStep(captureStep + 1);
    } else {
      // Última captura, ir a la vista previa final
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
      setCaptureStep(4); // Paso de confirmación/preview
    }
    setIsCapturing(false);
  };

  const handleSaveFace = async () => {
    if (collectedDescriptors.length < 3) {
      setFaceError("No se han completado las 3 capturas necesarias.");
      return;
    }
    setIsCapturing(true);
    setFaceError('');
    setFaceSuccess('');

    try {
      const token = getToken();
      await axios.post(`${STUDENT_API_URL}/register-face`, {
        descriptors: collectedDescriptors // Enviar el array de descriptores
      }, {
        headers: { 'x-auth-token': token }
      });
      setFaceSuccess("¡Rostros registrados exitosamente!");
      setTimeout(handleCloseFaceModal, 2000);
    } catch (err) {
      console.error("Error saving face descriptors:", err);
      setFaceError(err.response?.data?.message || "Error al guardar los rostros en el servidor.");
    } finally {
      setIsCapturing(false);
    }
  };

  const renderFaceRegistrationModal = () => {
    if (!isFaceModalOpen) return null;

    const instructions = {
      1: "Paso 1 de 3: Mira directamente a la cámara.",
      2: "Paso 2 de 3: Gira tu rostro ligeramente a la izquierda.",
      3: "Paso 3 de 3: Gira tu rostro ligeramente a la derecha.",
      4: "¡Capturas completadas! Revisa y guarda."
    };

    const guideImages = {
      1: '/assets/guide-front.png',
      2: '/assets/guide-left.png',
      3: '/assets/guide-right.png',
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{textAlign: 'center'}}>
          <h3>{instructions[captureStep]}</h3>
          <p>Asegúrate de que tu rostro esté bien iluminado y centrado.</p>
          <div style={{ position: 'relative', display: 'inline-block', width: '480px', height: '360px', backgroundColor: '#111' }}>
            <video
              ref={videoRef}
              autoPlay
              muted
              width="480"
              height="360"
              style={{
                borderRadius: '8px',
                transform: 'scaleX(-1)',
                display: captureStep <= 3 ? 'block' : 'none'
              }}
            ></video>
            {captureStep <= 3 && (
              <img
                src={guideImages[captureStep]}
                alt="Guía Facial"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0.6,
                  objectFit: 'contain', // <-- Añadir esta línea
                  pointerEvents: 'none' // Para que no interfiera con el video
                }}
              />
            )}
             {captureStep > 3 && <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'}}>Video pausado.</div>}
          </div>
          <div style={{marginTop: '1rem', minHeight: '2.5rem'}}>
            {faceError && <p style={styles.errorMessage}>{faceError}</p>}
            {faceSuccess && <p style={styles.successMessage}>{faceSuccess}</p>}
            {captureStep <= 3 && <p>Capturas realizadas: {collectedDescriptors.length} de 3</p>}
          </div>

          {videoDevices.length > 1 && captureStep <= 3 && (
            <div style={{ margin: '1rem 0' }}>
              <button onClick={handleCameraChange} className="btn-secondary">
                Cambiar Cámara 🔄
              </button>
            </div>
          )}

          <div className="modal-actions">
            {captureStep <= 3 && (
              <>
                <button onClick={handleCloseFaceModal} className="btn-secondary" disabled={isCapturing}>Cancelar</button>
                <button onClick={handleCapture} className="btn-primary" disabled={isCapturing}>
                  {isCapturing ? <><Spinner size="20px" color="white" /> Capturando...</> : `Capturar Foto ${captureStep}`}
                </button>
              </>
            )}
            {captureStep > 3 && (
              <>
                <button onClick={handleRestartCapture} className="btn-secondary" disabled={isCapturing}>Empezar de Nuevo</button>
                <button onClick={handleSaveFace} className="btn-primary" disabled={isCapturing}>
                  {isCapturing ? <><Spinner size="20px" color="white" /> Guardando...</> : 'Guardar Registros'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };
  // ===== FIN DE LA LÓGICA FACIAL =====

  if (loadingProfile && (!initialFetchedProfile || !initialFetchedProfile.id)) {
    return <div style={{...styles.pageContainer, ...styles.loadingContainer}} className="loading-container"><Spinner /></div>;
  }

  return (
    <div style={styles.pageContainer}>
      <h2 style={{ textAlign: 'center', marginBottom: '1rem' }}>
        Mi Perfil de Estudiante
      </h2>
      <p style={{textAlign: 'center', marginBottom: '1rem', fontSize: '1.2rem'}}> {/* Reduced margin bottom for greeting */}
        ¡Hola, {profile.nickname || profile.full_name || 'Estudiante'}!
      </p>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}> {/* New container for the link */}
        <Link to="/estudiante/dashboard" className="secondary-link" style={{fontSize: '0.95rem'}}>Volver al Panel</Link>
      </div>

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
            <label style={styles.label}>Nombre Completo (No editable):</label>
            {/* Specific style for readonly inputs to make them look slightly different if needed, but still dark-themed */}
            <input type="text" value={profile.full_name || ''} style={{...styles.input, backgroundColor: 'var(--input-background-readonly, #3a3a5e)'}} readOnly />
          </div>
           <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
                <label style={styles.label}>ID Estudiante (No editable):</label>
                <input type="text" value={profile.id || ''} style={{...styles.input, backgroundColor: 'var(--input-background-readonly, #3a3a5e)'}} readOnly />
            </div>
            <div style={styles.formGroup}>
                <label style={styles.label}>Edad (No editable):</label>
                <input type="text" value={profile.age || ''} style={{...styles.input, backgroundColor: 'var(--input-background-readonly, #3a3a5e)'}} readOnly />
            </div>
          </div>


          <div style={styles.formGroup}>
            <label htmlFor="nickname" style={styles.label}>Sobrenombre (Nickname):</label>
            <input type="text" id="nickname" name="nickname" value={profile.nickname || ''} onChange={handleProfileChange} style={styles.input} disabled={isUpdatingProfile} />
          </div>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="email" style={styles.label}>Correo Electrónico:</label>
              <input type="email" id="email" name="email" value={profile.email || ''} onChange={handleProfileChange} style={styles.input} required disabled={isUpdatingProfile} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="phone" style={styles.label}>Celular:</label>
              <input type="tel" id="phone" name="phone" value={profile.phone || ''} onChange={handleProfileChange} style={styles.input} pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos." disabled={isUpdatingProfile}/>
            </div>
          </div>

          <h4 style={{marginTop: '2rem', marginBottom: '1rem'}}>Datos del Apoderado</h4>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_full_name" style={styles.label}>Nombre Completo del Apoderado:</label>
              <input type="text" id="guardian_full_name" name="guardian_full_name" value={profile.guardian_full_name || ''} onChange={handleProfileChange} style={styles.input} disabled={isUpdatingProfile} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_relationship" style={styles.label}>Relación/Parentesco:</label>
              <input type="text" id="guardian_relationship" name="guardian_relationship" value={profile.guardian_relationship || ''} onChange={handleProfileChange} style={styles.input} disabled={isUpdatingProfile} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_phone" style={styles.label}>Teléfono del Apoderado:</label>
              <input type="tel" id="guardian_phone" name="guardian_phone" value={profile.guardian_phone || ''} onChange={handleProfileChange} style={styles.input} pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos." disabled={isUpdatingProfile}/>
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="guardian_email" style={styles.label}>Email del Apoderado:</label>
              <input type="email" id="guardian_email" name="guardian_email" value={profile.guardian_email || ''} onChange={handleProfileChange} style={styles.input} disabled={isUpdatingProfile} />
            </div>
          </div>

          <h4 style={{marginTop: '2rem', marginBottom: '1rem'}}>Datos Médicos y de Emergencia</h4>
          <div style={styles.formGroup}>
            <label htmlFor="medical_conditions" style={styles.label}>Condiciones Médicas Relevantes:</label>
            <textarea id="medical_conditions" name="medical_conditions" value={profile.medical_conditions || ''} onChange={handleProfileChange} style={styles.textarea} disabled={isUpdatingProfile}></textarea>
          </div>
          <div style={styles.gridContainer}>
            <div style={styles.formGroup}>
              <label htmlFor="emergency_contact_name" style={styles.label}>Nombre Contacto de Emergencia:</label>
              <input type="text" id="emergency_contact_name" name="emergency_contact_name" value={profile.emergency_contact_name || ''} onChange={handleProfileChange} style={styles.input} disabled={isUpdatingProfile} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="emergency_contact_phone" style={styles.label}>Teléfono Contacto de Emergencia:</label>
              <input type="tel" id="emergency_contact_phone" name="emergency_contact_phone" value={profile.emergency_contact_phone || ''} onChange={handleProfileChange} style={styles.input} pattern="\d{9,15}" title="Debe ser un número de 9 a 15 dígitos." disabled={isUpdatingProfile}/>
            </div>
          </div>

          <button type="submit" style={{...styles.button, ...(isUpdatingProfile || !profileHasChanged) && styles.buttonDisabled}} disabled={isUpdatingProfile || !profileHasChanged}>
            {isUpdatingProfile ? <><Spinner size="20px" color="white" /> Guardando...</> : 'Guardar Cambios de Perfil'}
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
            <label htmlFor="current_password_student" style={styles.label}>Contraseña Actual:</label>
            <input type="password" id="current_password_student" name="current_password" value={passwordData.current_password} onChange={handlePasswordChange} style={styles.input} required disabled={loadingPassword} />
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="new_password_student" style={styles.label}>Nueva Contraseña:</label>
            <input type="password" id="new_password_student" name="new_password" value={passwordData.new_password} onChange={handlePasswordChange} style={styles.input} required minLength="6" disabled={loadingPassword}/>
          </div>
          <div style={styles.formGroup}>
            <label htmlFor="confirm_new_password_student" style={styles.label}>Confirmar Nueva Contraseña:</label>
            <input type="password" id="confirm_new_password_student" name="confirm_new_password" value={passwordData.confirm_new_password} onChange={handlePasswordChange} style={styles.input} required minLength="6" disabled={loadingPassword}/>
          </div>
          <button type="submit" style={{...styles.button, ...(loadingPassword && styles.buttonDisabled)}} disabled={loadingPassword}>
            {loadingPassword ? <><Spinner size="20px" color="white" /> Cambiando...</> : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* Face Registration Section */}
      <div style={styles.formSection}>
        <h3>Registro Facial para Asistencia</h3>
        <p style={{marginBottom: '1rem', fontSize: '0.9em'}}>
          Este registro permitirá marcar tu asistencia automáticamente usando la cámara.
        </p>
        {faceError && <p style={styles.errorMessage}>{faceError}</p>}
        {faceSuccess && <p style={styles.successMessage}>{faceSuccess}</p>}
        <button type="button" onClick={handleOpenFaceModal} style={styles.button}>
          {faceApiLoaded ? 'Registrar / Actualizar Rostro' : 'Cargando Herramientas de IA...'}
        </button>
      </div>
      {renderFaceRegistrationModal()}
    </div>
  );
};

export default StudentProfilePage;
