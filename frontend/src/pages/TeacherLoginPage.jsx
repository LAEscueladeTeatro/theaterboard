import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const TeacherLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); // Limpiar errores previos

    if (!email || !password) {
      setError('Por favor, ingrese email y contraseña.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/api/auth/login/teacher', {
        email,
        password,
      });

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
    }
  };

  return (
    <div className="centered-form-page">
      <div className="form-card">
        <h2>Acceso Docente</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Correo Electrónico:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div>
            <label htmlFor="password">Contraseña:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p style={{ color: 'var(--primary-color-teacher)', fontWeight: '500', marginTop: '1rem' }}>{error}</p>}
          <button type="submit" className="btn-action btn-teacher">
            <span className="icon">[&rarr;]</span>Ingresar
          </button>
        </form>
        {/* <Link to="/recuperar-password" className="secondary-link">¿Olvidaste tu contraseña?</Link> */}
      </div>
    </div>
  );
};

export default TeacherLoginPage;
