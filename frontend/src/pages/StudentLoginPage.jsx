import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const StudentLoginPage = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_URL = 'http://localhost:3001/api';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!studentId || !password) {
      setError('Por favor, ingrese ID de estudiante y contraseña.');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/auth/login/student`, {
        student_id: studentId,
        password,
      });

      if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token); // Guardar token de estudiante
        navigate('/estudiante/dashboard');
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
      console.error('Student login error:', err);
    }
  };

  return (
    <div>
      <h2>Login Estudiante</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="studentId">ID de Estudiante (Ej: ET001):</label>
          <input
            type="text"
            id="studentId"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value.toUpperCase())} // Convertir a mayúsculas
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
      <p><Link to="/">Volver al Inicio</Link></p>
    </div>
  );
};

export default StudentLoginPage;
