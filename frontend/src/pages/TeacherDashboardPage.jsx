import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const TeacherDashboardPage = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('teacherToken');
    navigate('/docente/login');
  };

  // La lista de estudiantes ahora es una vista separada, podemos enlazarla.
  // Asumiré que la ruta para la lista de estudiantes es /docente/students
  // Esto requerirá configurar esa ruta en App.jsx más adelante.

  return (
    <div>
      <h2>Panel del Docente</h2>
      <nav>
        <ul>
          <li><Link to="/docente/asistencia">Registrar Asistencia</Link></li>
          <li><Link to="/docente/puntuaciones">Registrar Puntuaciones</Link></li>
          <li><Link to="/docente/resumen">Resumen de Puntos</Link></li> {/* Actualizado */}
          <li><Link to="/docente/ranking">Ranking Mensual</Link></li> {/* Actualizado */}
          <li><Link to="/docente/lista-estudiantes">Lista de Estudiantes</Link></li>
          {/* <li><Link to="/docente/base-datos">Base de datos</Link></li> (Definir qué es esto) */}
          {/* <li><Link to="/docente/editar-registro">Editar registro</Link></li> (Definir qué es esto) */}
          {/* <li><Link to="/docente/icono-registro">Ícono de registro</Link></li> (Definir qué es esto) */}
          <li><button onClick={handleLogout}>Salir</button></li>
        </ul>
      </nav>
      <p>Bienvenido al panel de control. Desde aquí podrás gestionar las actividades de la escuela.</p>
      {/* Aquí se renderizarán los componentes de cada funcionalidad del menú */}
    </div>
  );
};

export default TeacherDashboardPage;
