import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const DisabledStudentListPage = () => {
  const [disabledStudents, setDisabledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const API_URL = 'http://localhost:3001/api/admin/students';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchDisabledStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}?active=false`, { // Fetch inactive students
        headers: { 'x-auth-token': token },
      });
      setDisabledStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar estudiantes inhabilitados.');
      console.error("Error fetching disabled students:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL]);

  useEffect(() => {
    fetchDisabledStudents();
  }, [fetchDisabledStudents]);

  const handleSetStudentStatus = async (studentId, isActive) => {
    const action = isActive ? "habilitar" : "inhabilitar";
    if (!window.confirm(`¿Está seguro que desea ${action} a este estudiante?`)) return;

    try {
      const token = getToken();
      await axios.put(`${API_URL}/${studentId}/set-status`, { is_active: isActive }, { headers: { 'x-auth-token': token }});
      fetchDisabledStudents(); // Recargar lista de estudiantes inhabilitados
      alert(`Estudiante ${action}do con éxito.`);
    } catch (err) {
      console.error(`Error ${action}ing student:`, err);
      alert(`Error: ${err.response?.data?.message || `No se pudo ${action} el estudiante.`}`);
    }
  };

  const handleDeletePermanent = async (studentId, studentName) => {
    if (!window.confirm(`¿ESTÁ ABSOLUTAMENTE SEGURO que desea ELIMINAR PERMANENTEMENTE a ${studentName} (${studentId})? Esta acción no se puede deshacer y borrará todos sus registros asociados.`)) return;
    if (!window.confirm(`Confirmación final: ¿Realmente desea ELIMINAR PERMANENTEMENTE a ${studentName}?`)) return;


    try {
      const token = getToken();
      await axios.delete(`${API_URL}/${studentId}/permanent-delete`, { headers: { 'x-auth-token': token }});
      fetchDisabledStudents(); // Recargar lista
      alert(`Estudiante ${studentName} (${studentId}) eliminado permanentemente.`);
    } catch (err) {
      console.error("Error deleting student permanently:", err);
      alert(`Error: ${err.response?.data?.message || 'No se pudo eliminar el estudiante.'}`);
    }
  };


  if (loading) return <p>Cargando lista de estudiantes inhabilitados...</p>;
  if (error) return <div><p style={{color: 'red'}}>Error: {error}</p><Link to="/docente/lista-estudiantes">Volver a Lista Principal</Link></div>;

  return (
    <div>
      <h2>Alumnos Inhabilitados</h2>
      <p><Link to="/docente/lista-estudiantes">Volver a Lista de Estudiantes Activos</Link></p>
      <p><Link to="/docente/dashboard">Volver al Panel Principal</Link></p>

      {disabledStudents.length === 0 ? (
        <p>No hay estudiantes inhabilitados.</p>
      ) : (
        <table border="1" style={{width: '100%', borderCollapse: 'collapse', marginTop: '20px'}}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre Completo</th>
              <th>Apodo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {disabledStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.full_name}</td>
                <td>{student.nickname || '-'}</td>
                <td>
                  <button onClick={() => handleSetStudentStatus(student.id, true)} style={{marginRight: '5px'}}>Habilitar</button>
                  <button onClick={() => handleDeletePermanent(student.id, student.full_name)} style={{color: 'red'}}>Eliminar Permanentemente</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default DisabledStudentListPage;
