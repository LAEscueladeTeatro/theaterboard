import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentListPage from './pages/StudentListPage';
import DisabledStudentListPage from './pages/DisabledStudentListPage'; // Nueva página de inhabilitados
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import TeacherScoresPage from './pages/TeacherScoresPage';
import TeacherSummaryPage from './pages/TeacherSummaryPage';
import TeacherRankingPage from './pages/TeacherRankingPage';
import StudentLoginPage from './pages/StudentLoginPage';
import StudentDashboardPage from './pages/StudentDashboardPage';
import StudentScoresDetailPage from './pages/StudentScoresDetailPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div>
        <header>
          <nav>
            <Link to="/">Home</Link> | {' '}
            <Link to="/docente/login">Login Docente</Link> | {' '}
            <Link to="/estudiante/login">Login Estudiante</Link> {/* Enlace añadido */}
          </nav>
          <h1>TheaterBoard</h1>
        </header>

        <main>
          <Routes>
            {/* Ruta principal o de bienvenida */}
            <Route path="/" element={
              <div>
                <h2>Bienvenido a TheaterBoard</h2>
                <p>Sistema de gestión para escuelas de teatro.</p>
                <p><Link to="/docente/login">Acceder como Docente</Link></p>
                <p><Link to="/estudiante/login">Acceder como Estudiante</Link></p> {/* Enlace añadido */}
              </div>
            } />

            {/* Rutas de Docente */}
            <Route path="/docente/login" element={<TeacherLoginPage />} />

            <Route element={<ProtectedRoute tokenType="teacherToken" redirectTo="/docente/login" />}>
              <Route path="/docente/dashboard" element={<TeacherDashboardPage />} />
              <Route path="/docente/lista-estudiantes" element={<StudentListPage />} />
              <Route path="/docente/lista-estudiantes/inhabilitados" element={<DisabledStudentListPage />} /> {/* Nueva ruta */}
              <Route path="/docente/asistencia" element={<TeacherAttendancePage />} />
              <Route path="/docente/puntuaciones" element={<TeacherScoresPage />} />
              <Route path="/docente/resumen" element={<TeacherSummaryPage />} />
              <Route path="/docente/ranking" element={<TeacherRankingPage />} />
              {/* Aquí se añadirán más rutas protegidas para el docente en el futuro */}
            </Route>

            {/* Rutas de Estudiante */}
            <Route path="/estudiante/login" element={<StudentLoginPage />} />
            <Route element={<ProtectedRoute tokenType="studentToken" redirectTo="/estudiante/login" />}>
              <Route path="/estudiante/dashboard" element={<StudentDashboardPage />} />
              <Route path="/estudiante/mis-puntajes" element={<StudentScoresDetailPage />} /> {/* Nueva ruta */}
            </Route>

            {/* Ruta por defecto para URLs no encontradas */}
            <Route path="*" element={
              <div>
                <h2>Página no encontrada (404)</h2>
                <Link to="/">Volver al inicio</Link>
              </div>
            } />
          </Routes>
        </main>

        <footer>
          <p>&copy; {new Date().getFullYear()} TheaterBoard</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
