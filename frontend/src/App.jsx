import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import './App.css';

import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentListPage from './pages/StudentListPage';
import DisabledStudentListPage from './pages/DisabledStudentListPage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import TeacherScoresPage from './pages/TeacherScoresPage';
import TeacherSummaryPage from './pages/TeacherSummaryPage';
import TeacherRankingPage from './pages/TeacherRankingPage';
import TeacherDatabasePage from './pages/TeacherDatabasePage';
import TeacherHistoricAttendancePage from './pages/TeacherHistoricAttendancePage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentScoresDetailPage from './pages/StudentScoresDetailPage';
import PublicRegistrationPage from './pages/PublicRegistrationPage';
import ProtectedRoute from './components/ProtectedRoute';
import WhatsAppButton from './components/WhatsAppButton';

// SVG Icons components
const AcademicCapIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M3.375 3C2.339 3 1.5 3.84 1.5 4.875v11.25C1.5 17.16 2.34 18 3.375 18H9.75v1.5H6.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H14.25v-1.5h6.375c1.035 0 1.875-.84 1.875-1.875V4.875C22.5 3.839 21.66 3 20.625 3H3.375zM12 9a1.875 1.875 0 100-3.75A1.875 1.875 0 000 3.75zM4.5 4.5H9A.75.75 0 009 3H4.5a.75.75 0 000 1.5zm0 3H9A.75.75 0 009 6H4.5a.75.75 0 000 1.5zm0 3H9A.75.75 0 009 9H4.5a.75.75 0 000 1.5zm13.5-3H15a.75.75 0 000 1.5h3a.75.75 0 000-1.5zm0-3H15a.75.75 0 000 1.5h3a.75.75 0 000-1.5z" />
     <path d="M10.313 12.188c.063.047.125.094.188.141l.062.062a1.875 1.875 0 002.876 0l.062-.062c.063-.047.125-.094.188-.141H10.312z" /> {/* Fixed cap details */}
  </svg>
);

const UserIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
  </svg>
);

const PencilIcon = () => (
 <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
  <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
</svg>
);

function App() {
  return (
    <Router>
      <div>
        <header>
          <nav>
            <Link to="/">Home</Link> | {' '}
            <Link to="/docente/login">Login Docente</Link> | {' '}
            <Link to="/estudiante/login">Login Estudiante</Link> | {' '}
            <Link to="/registro">Regístrate Aquí</Link>
          </nav>
          <h1 className="app-title-header">TheaterBoard</h1>
        </header>

        <main>
          <Routes>
            <Route path="/" element={
              <div className="home-container">
                <h2 className="home-title">TheaterBoard 2025</h2>
                <Link to="/docente/login" className="btn-action btn-teacher">
                  <AcademicCapIcon />Acceder como Docente
                </Link>
                <Link to="/estudiante/login" className="btn-action btn-student">
                  <UserIcon />Acceder como Estudiante
                </Link>
                <Link to="/registro" className="btn-action btn-register">
                  <PencilIcon />Regístrate Aquí
                </Link>
              </div>
            } />
            <Route path="/registro" element={<PublicRegistrationPage />} />
            <Route path="/docente/login" element={<TeacherLoginPage />} />
            <Route element={<ProtectedRoute tokenType="teacherToken" redirectTo="/docente/login" />}>
              <Route path="/docente/dashboard" element={<TeacherDashboardPage />} />
              <Route path="/docente/lista-estudiantes" element={<StudentListPage />} />
              <Route path="/docente/lista-estudiantes/inhabilitados" element={<DisabledStudentListPage />} />
              <Route path="/docente/database" element={<TeacherDatabasePage />} />
              <Route path="/docente/asistencia" element={<TeacherAttendancePage />} />
              <Route path="/docente/puntuaciones" element={<TeacherScoresPage />} />
              <Route path="/docente/resumen" element={<TeacherSummaryPage />} />
              <Route path="/docente/ranking" element={<TeacherRankingPage />} />
              <Route path="/docente/ingreso-historico" element={<TeacherHistoricAttendancePage />} />
            </Route>
            <Route path="/estudiante/login" element={<StudentLoginPage />} />
            <Route element={<ProtectedRoute tokenType="studentToken" redirectTo="/estudiante/login" />}>
              <Route path="/estudiante/dashboard" element={<StudentDashboardPage />} />
              <Route path="/estudiante/mis-puntajes" element={<StudentScoresDetailPage />} />
            </Route>
            <Route path="*" element={
              <div className="centered-form-page" style={{textAlign: 'center'}}>
                <h2>Página no encontrada (404)</h2>
                <Link to="/" className="btn-action btn-student" style={{minWidth: 'auto', marginTop: '1rem'}}>Volver al inicio</Link>
              </div>
            } />
          </Routes>
        </main>
        <footer>
          <p>&copy; {new Date().getFullYear()} TheaterBoard</p>
        </footer>
        <WhatsAppButton />
      </div>
    </Router>
  );
}
export default App;
overwrite_file_with_block
frontend/src/pages/TeacherLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ArrowRightOnRectangleIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

const TeacherLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Por favor, ingrese email y contraseña.');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3001/api/auth/login/teacher', { email, password });
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
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ejemplo@correo.com" required />
          </div>
          <div>
            <label htmlFor="password">Contraseña:</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ color: 'var(--primary-color-teacher)', fontWeight: '500', marginTop: '1rem', textAlign:'center' }}>{error}</p>}
          <button type="submit" className="btn-action btn-teacher">
            <ArrowRightOnRectangleIcon />Ingresar
          </button>
        </form>
        {/* <Link to="/recuperar-password" className="secondary-link">¿Olvidaste tu contraseña?</Link> */}
      </div>
    </div>
  );
};

export default TeacherLoginPage;
overwrite_file_with_block
frontend/src/pages/StudentLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const ArrowRightOnRectangleIcon = () => (
  <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path fillRule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

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
      const response = await axios.post(`${API_URL}/auth/login/student`, { student_id: studentId, password });
      if (response.data.token) {
        localStorage.setItem('studentToken', response.data.token);
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
    <div className="centered-form-page">
      <div className="form-card">
        <h2>Acceso Estudiante</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="studentId">ID de Estudiante (Ej: ET001):</label>
            <input type="text" id="studentId" value={studentId} onChange={(e) => setStudentId(e.target.value.toUpperCase())} placeholder="ET000" required />
          </div>
          <div>
            <label htmlFor="password">Contraseña:</label>
            <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <p style={{ color: 'var(--primary-color-student)', fontWeight: '500', marginTop: '1rem', textAlign: 'center' }}>{error}</p>}
          <button type="submit" className="btn-action btn-student">
            <ArrowRightOnRectangleIcon />Ingresar
          </button>
        </form>
        <Link to="/" className="secondary-link">Volver al Inicio</Link>
      </div>
    </div>
  );
};

export default StudentLoginPage;
