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
    <div>
      <h2>Login Docente</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            required
          />
        </div>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <button type="submit">Ingresar</button>
      </form>
    </div>
  );
};

export default TeacherLoginPage;
