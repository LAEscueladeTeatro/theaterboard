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
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3001/api/public/register';

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
        age: parseInt(formData.age, 10) || null, // Asegurar que la edad sea número
    };

    try {
      const response = await axios.post(API_URL, payload);
      setSuccessMessage(response.data.message || '¡Registro exitoso! Revisa tu correo o contacta a la escuela para más detalles.');
      setFormData(initialFormData); // Limpiar formulario
      // Opcionalmente redirigir o mostrar un mensaje más permanente
      // setTimeout(() => navigate('/'), 5000);
    } catch (err) {
      console.error("Error en el registro público:", err);
      setError(err.response?.data?.message || 'Error al procesar el registro. Por favor, intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{maxWidth: '700px', margin: '20px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px'}}>
      <h2>Formulario de Inscripción TheaterBoard</h2>
      <p><Link to="/">Volver al Inicio</Link></p>

      {successMessage && <p style={{color: 'green', fontWeight: 'bold'}}>{successMessage}</p>}
      {error && <p style={{color: 'red'}}>{error}</p>}

      {!successMessage && ( // Ocultar formulario después de éxito
        <form onSubmit={handleSubmit}>
          <h4>Datos del Alumno</h4>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div><label htmlFor="full_name">Apellidos y Nombres Completos*:</label><input type="text" name="full_name" value={formData.full_name} onChange={handleChange} required /></div>
            <div><label htmlFor="nickname">Sobrenombre (Cómo te gusta que te llamen)*:</label><input type="text" name="nickname" value={formData.nickname} onChange={handleChange} required /></div>
            <div><label htmlFor="birth_date">Fecha de Nacimiento*:</label><input type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} required /></div>
            <div><label htmlFor="age">Edad* (se calcula con fecha nac.):</label><input type="number" name="age" value={formData.age} onChange={handleChange} required readOnly={!!formData.birth_date} /></div>
            <div><label htmlFor="phone">Celular*:</label><input type="tel" name="phone" value={formData.phone} onChange={handleChange} required /></div>
            <div><label htmlFor="email">Correo Electrónico*:</label><input type="email" name="email" value={formData.email} onChange={handleChange} required /></div>
          </div>

          {isMinor && (
            <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px dashed #ccc'}}>
              <h4>Datos del Apoderado (Obligatorio para menores de 18)</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div><label htmlFor="guardian_full_name">Apellidos y Nombres del Apoderado*:</label><input type="text" name="guardian_full_name" value={formData.guardian_full_name} onChange={handleChange} required={isMinor} /></div>
                <div><label htmlFor="guardian_relationship">Parentesco*:</label><input type="text" name="guardian_relationship" value={formData.guardian_relationship} onChange={handleChange} required={isMinor} /></div>
                <div><label htmlFor="guardian_phone">Celular del Apoderado*:</label><input type="tel" name="guardian_phone" value={formData.guardian_phone} onChange={handleChange} required={isMinor} /></div>
                <div><label htmlFor="guardian_email">Correo del Apoderado*:</label><input type="email" name="guardian_email" value={formData.guardian_email} onChange={handleChange} required={isMinor}/></div>
              </div>
            </div>
          )}

          <h4 style={{marginTop: '20px'}}>Información Adicional</h4>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
            <div><label htmlFor="emergency_contact_name">Nombre Contacto de Emergencia:</label><input type="text" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleChange} /></div>
            <div><label htmlFor="emergency_contact_phone">Celular Contacto de Emergencia:</label><input type="tel" name="emergency_contact_phone" value={formData.emergency_contact_phone} onChange={handleChange} /></div>
          </div>
          <div style={{marginTop: '10px'}}><label htmlFor="medical_conditions">¿Alguna condición médica o alergia a considerar?</label><textarea name="medical_conditions" value={formData.medical_conditions} onChange={handleChange} rows="3"></textarea></div>
          <div style={{marginTop: '10px'}}><label htmlFor="comments">Comentarios o dudas adicionales:</label><textarea name="comments" value={formData.comments} onChange={handleChange} rows="3"></textarea></div>

          <div style={{marginTop:'25px', textAlign: 'center'}}>
            <button type="submit" disabled={loading} style={{padding: '10px 20px', fontSize: '1.1em'}}>
              {loading ? 'Enviando Registro...' : 'Registrarme'}
            </button>
          </div>
        </form>
      )}
      {/* Reutilizar estilos de modal para inputs si se desea, o definir unos propios */}
      <style jsx global>{`
        // Estilos básicos para inputs y labels en esta página
        // Idealmente, estos serían más globales o parte de un sistema de diseño
        label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9em; }
        input[type="text"], input[type="number"], input[type="email"], input[type="tel"], input[type="date"], textarea {
          width: 100%; padding: 10px; margin-bottom:10px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
        }
        textarea { min-height: 60px; }
      `}</style>
    </div>
  );
};

export default PublicRegistrationPage;
