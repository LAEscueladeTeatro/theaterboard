import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const PublicRegistrationPage = () => {
  const initialFormData = {
    full_name: '',
    nickname: '',
    age: '',
    birth_date: '',
    phone: '',
    email: '',
    guardian_full_name: '',
    guardian_relationship: '',
    guardian_phone: '',
    guardian_email: '',
    medical_conditions: '',
    comments: '',
    emergency_contact_name: '',
    emergency_contact_phone: ''
  };
  const [formData, setFormData] = useState(initialFormData);
  const [isMinor, setIsMinor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  // const navigate = useNavigate(); // No se usa directamente si no hay redirección post-éxito

  // Estados para el estado global de registro
  const [isRegistrationGloballyEnabled, setIsRegistrationGloballyEnabled] = useState(true); // Asumir true hasta verificar
  const [loadingStatus, setLoadingStatus] = useState(true); // Cargando estado global al inicio
  const [globalStatusError, setGlobalStatusError] = useState('');


  const API_PUBLIC_URL = 'http://localhost:3001/api/public'; // URL base para endpoints públicos

  useEffect(() => {
    const checkRegistrationStatus = async () => {
      setLoadingStatus(true);
      setGlobalStatusError('');
      try {
        const response = await axios.get(`${API_PUBLIC_URL}/settings/registration-status-check`);
        setIsRegistrationGloballyEnabled(response.data.enabled);
      } catch (err) {
        console.error("Error checking registration status:", err);
        // Si hay error al verificar, por precaución, podríamos deshabilitar el form o mostrar un error específico
        // Por ahora, si falla, se mantendrá el valor de isRegistrationGloballyEnabled (que podría ser true por defecto)
        // y el backend hará la validación final. O podríamos setearlo a false.
        setGlobalStatusError('No se pudo verificar el estado de las inscripciones. Intente más tarde.');
        setIsRegistrationGloballyEnabled(false); // Más seguro deshabilitar si no se puede verificar
      } finally {
        setLoadingStatus(false);
      }
    };
    checkRegistrationStatus();
  }, [API_PUBLIC_URL]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'birth_date' && value) {
      const birthDate = new Date(value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      setFormData(prev => ({ ...prev, age: age.toString() })); // Actualizar edad automáticamente
      setIsMinor(age < 18);
    }
    if (name === 'age') {
        const ageNum = parseInt(value, 10);
        setIsMinor(ageNum < 18);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Validaciones básicas adicionales del lado del cliente
    if (isMinor && (!formData.guardian_full_name || !formData.guardian_phone)) {
        setError('Para menores de edad, el nombre completo y celular del apoderado son obligatorios.');
        setLoading(false);
        return;
    }

    const payload = {
        ...formData,
        age: parseInt(formData.age, 10) || null,
    };

    try {
      // Usar API_PUBLIC_URL para el endpoint de registro
      const response = await axios.post(`${API_PUBLIC_URL}/register`, payload);
      setSuccessMessage(response.data.message || '¡Registro exitoso! Revisa tu correo o contacta a la escuela para más detalles.');
      setFormData(initialFormData);
    } catch (err) {
      console.error("Error en el registro público:", err);
      if (err.response && err.response.status === 403) { // Manejar el caso de registro cerrado
        setError(err.response.data.message || "Las inscripciones están cerradas actualmente.");
        setIsRegistrationGloballyEnabled(false); // Actualizar estado local si el backend lo indica
      } else {
        setError(err.response?.data?.message || 'Error al procesar el registro. Por favor, intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Icono para el botón de registro
  const PencilIcon = () => (
    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
     <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
   </svg>
   );

  return (
    <div className="centered-form-page public-registration-page"> {/* Clase adicional para posible override de max-width */}
      <div className="form-card"> {/* Usar form-card, pero podría necesitar un max-width mayor */}
        <h2>¡Bienvenid@ a TheaterBoard!</h2>
        <p style={{fontSize: '1rem', marginBottom: '1rem'}}>Estamos muy contentos de que quieras unirte a nuestra familia teatral.</p>
        <p style={{fontSize: '0.9rem', marginBottom: '1.5rem'}}>
          Antes de empezar, por favor, dale una leída a nuestro <a href="https://drive.google.com/file/d/1jB6jiBouFFCbMo45FGiidC499eLyBjlt/view" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color-student)', fontWeight:'500'}}>Reglamento Interno</a>. Es importante que lo conozcas.
        </p>

        {loadingStatus && <p className="text-center" style={{margin: '2rem 0'}}>Verificando estado de inscripciones...</p>}
        {globalStatusError && <div className="error-message-page" style={{textAlign:'center'}}>{globalStatusError}</div>}

        {!loadingStatus && !isRegistrationGloballyEnabled && !successMessage && (
          <div className="empty-table-message" style={{marginTop: '2rem', backgroundColor: 'var(--input-background)'}}>
            <h3>Inscripciones Cerradas</h3>
            <p>Las inscripciones públicas están cerradas temporalmente. Por favor, vuelve a intentarlo más tarde o contáctanos para más información.</p>
          </div>
        )}

        {successMessage && <p style={{color: 'var(--primary-color-register)', fontWeight: 'bold', fontSize: '1.1rem', margin: '1rem 0', textAlign: 'center'}}>{successMessage}</p>}
        {error && !globalStatusError && <p style={{color: '#FF6B6B', fontWeight: '500', margin: '1rem 0', textAlign: 'center'}}>{error}</p>}

        {!loadingStatus && isRegistrationGloballyEnabled && !successMessage && (
          <form onSubmit={handleSubmit}>
            <h4 className="form-section-title">Datos del Alumno</h4>
            <div className="form-grid">
              <div><label htmlFor="full_name">Apellidos y Nombres Completos*:</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required placeholder="Ej: Pérez Gonzáles, Juan Carlos"/></div>
              <div><label htmlFor="nickname">Sobrenombre (Cómo te gusta que te llamen)*:</label><input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required placeholder="Ej: Juan, Juanca"/></div>
              <div><label htmlFor="birth_date">Fecha de Nacimiento*:</label><input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} required /></div>
              <div><label htmlFor="age">Edad* (se calcula):</label><input type="number" name="age" value={formData.age} onChange={handleChange} required readOnly={!!formData.birth_date} /></div>
              <div><label htmlFor="phone">Celular*:</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="987654321"/></div>
              <div><label htmlFor="email">Correo Electrónico*:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required placeholder="tu@correo.com"/></div>
            </div>

            {isMinor && (
              <div className="form-section">
                <h4 className="form-section-title">Datos del Apoderado (Obligatorio para menores de 18)</h4>
                <div className="form-grid">
                  <div><label htmlFor="guardian_full_name">Nombres del Apoderado*:</label><input type="text" name="guardian_full_name" value={formData.guardian_full_name} onChange={handleChange} required={isMinor} /></div>
                  <div><label htmlFor="guardian_relationship">Parentesco*:</label><input type="text" name="guardian_relationship" value={formData.guardian_relationship} onChange={handleChange} required={isMinor} /></div>
                  <div><label htmlFor="guardian_phone">Celular del Apoderado*:</label><input type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required={isMinor} /></div>
                  <div><label htmlFor="guardian_email">Correo del Apoderado:</label><input type="email" name="guardian_email" value={formData.guardian_email} onChange={handleChange} /></div>
                </div>
              </div>
            )}

            <div className="form-section">
              <h4 className="form-section-title">Información Adicional</h4>
              <div className="form-grid">
                <div><label htmlFor="emergency_contact_name">Nombre Contacto de Emergencia:</label><input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} /></div>
                <div><label htmlFor="emergency_contact_phone">Celular Contacto de Emergencia:</label><input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} /></div>
              </div>
              <div style={{ gridColumn: '1 / -1', marginTop:'1rem' }}><label htmlFor="medical_conditions">¿Alguna condición médica o alergia a considerar?</label><textarea name="medical_conditions" value={formData.medical_conditions} onChange={handleChange} rows="3" placeholder="Ninguna / Describir aquí..."></textarea></div>
              <div style={{ gridColumn: '1 / -1', marginTop:'1rem' }}><label htmlFor="comments">Comentarios o dudas adicionales:</label><textarea name="comments" value={formData.comments} onChange={handleChange} rows="3" placeholder="Escribe aquí tus comentarios..."></textarea></div>
            </div>

            <div className="form-footer-notes">
              <p><strong>Importante:</strong></p>
              <ul>
                <li>Asegúrate de haber revisado nuestro <a href="https://drive.google.com/file/d/1jB6jiBouFFCbMo45FGiidC499eLyBjlt/view" target="_blank" rel="noopener noreferrer" style={{color: 'var(--primary-color-student)', fontWeight:'500'}}>Reglamento Interno</a> antes de enviar tu inscripción.</li>
                <li>Una vez enviado el formulario, nos pondremos en contacto contigo. Las credenciales de acceso a la plataforma (usuario y contraseña) se entregarán personalmente en la escuela.</li>
              </ul>
            </div>

            <div style={{marginTop:'1.5rem', textAlign: 'center'}}>
              <button type="submit" disabled={loading} className="btn-action btn-register">
                <PencilIcon /> {loading ? 'Enviando Registro...' : 'Completar Inscripción'}
              </button>
            </div>
          </form>
        )}
        <Link to="/" className="secondary-link" style={{marginTop: '2rem'}}>Volver al Inicio</Link>
      </div>
      {/* Eliminados los estilos <style jsx global> */}
    </div>
  );
};

export default PublicRegistrationPage;
