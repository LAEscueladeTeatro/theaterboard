import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Para volver al dashboard

const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const token = localStorage.getItem('teacherToken'); // Asumimos que esta ruta también podría ser protegida o necesitar token
        const response = await axios.get('http://localhost:3001/api/students', {
          headers: {
            'x-auth-token': token, // Enviar token si la ruta de estudiantes se protege en el futuro
          },
        });
        setStudents(response.data);
      } catch (err) {
        setError(err.message || 'Error al cargar estudiantes');
        console.error("Error fetching students:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  if (loading) {
    return <p>Cargando lista de estudiantes...</p>;
  }

  if (error) {
    return (
      <div>
        <p>Error al cargar estudiantes: {error}</p>
        <Link to="/docente/dashboard">Volver al Panel</Link>
      </div>
    );
  }

  return (
    <div>
      <h2>Lista de Estudiantes</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>
      {students.length === 0 ? (
        <p>No se encontraron estudiantes.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Apodo</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.full_name}</td>
                <td>{student.nickname}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default StudentListPage;
