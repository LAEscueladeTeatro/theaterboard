import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from "../config";
import Spinner from '../components/Spinner'; // Importar Spinner
import PasswordInput from '../components/PasswordInput';

const ArrowRightOnRectangleIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

const TeacherLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Estado para el spinner
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, ingrese email y contraseña.');
      return;
    }
    setIsLoading(true); // Activar spinner
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/teacher`, { email, password });
      if (response.data.token) {
        localStorage.setItem('teacherToken', response.data.token);
        navigate('/docente/dashboard');
      } else {
        setError('No se recibió token del servidor.');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError('No se pudo conectar al servidor. Verifique su conexión.');
      } else {
        setError('Ocurrió un error durante el login.');
      }
      console.error('Login error:', err);
    } finally {
      setIsLoading(false); // Desactivar spinner
    }
  };

  return (
    <div className="centered-form-page">
      <div className="form-card">
        <h2>Acceso Docente</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Correo Electrónico:</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@correo.com" required disabled={isLoading} />
          </div>
          <div>
            <label htmlFor="password">Contraseña:</label>
            <PasswordInput
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>
          {error && <p style={{ color: 'var(--primary-color-teacher)', fontWeight: '500', marginTop: '1rem', textAlign:'center' }}>{error}</p>}
          <button type="submit" className="btn-action btn-teacher" disabled={isLoading}>
            {isLoading ? (
              <><Spinner size="20px" color="white" /> Ingresando...</>
            ) : (
              <><ArrowRightOnRectangleIcon />Ingresar</>
            )}
          </button>
        </form>
        {/* <Link to="/recuperar-password" className="secondary-link">¿Olvidaste tu contraseña?</Link> */}
      </div>
    </div>
  );
};

export default TeacherLoginPage;
