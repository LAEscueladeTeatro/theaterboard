import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import './App.css';

import TeacherLoginPage from './pages/TeacherLoginPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import StudentListPage from './pages/StudentListPage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import TeacherScoresPage from './pages/TeacherScoresPage';
import TeacherSummaryPage from './pages/TeacherSummaryPage'; // Nueva página de resumen
import TeacherRankingPage from './pages/TeacherRankingPage'; // Nueva página de ranking
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <div>
        <header>
          <nav>
            <Link to="/">Home</Link> | {' '}
            <Link to="/docente/login">Login Docente</Link>
            {/* Podríamos añadir más enlaces generales aquí si es necesario */}
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
                {/* <p><Link to="/estudiante/login">Acceder como Estudiante</Link></p> */}
              </div>
            } />

            {/* Rutas de Docente */}
            <Route path="/docente/login" element={<TeacherLoginPage />} />

            <Route element={<ProtectedRoute tokenType="teacherToken" redirectTo="/docente/login" />}>
              <Route path="/docente/dashboard" element={<TeacherDashboardPage />} />
              <Route path="/docente/lista-estudiantes" element={<StudentListPage />} />
              <Route path="/docente/asistencia" element={<TeacherAttendancePage />} />
              <Route path="/docente/puntuaciones" element={<TeacherScoresPage />} />
              <Route path="/docente/resumen" element={<TeacherSummaryPage />} /> {/* Nueva ruta */}
              <Route path="/docente/ranking" element={<TeacherRankingPage />} /> {/* Nueva ruta */}
              {/* Aquí se añadirán más rutas protegidas para el docente en el futuro */}
            </Route>

            {/* Rutas de Estudiante (se añadirán en Fase 5) */}
            {/* <Route path="/estudiante/login" element={<StudentLoginPage />} /> */}
            {/* <Route element={<ProtectedRoute tokenType="studentToken" redirectTo="/estudiante/login" />}> */}
            {/*   <Route path="/estudiante/dashboard" element={<StudentDashboardPage />} /> */}
            {/* </Route> */}

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
