import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from "../config";
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast'; // Importar toast

// Iconos SVG
const EnableIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const TrashIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75H4.75a.75.75 0 000 1.5h10.5a.75.75 0 000-1.5H14A2.75 2.75 0 0011.25 1H8.75zM10 4.75A.75.75 0 0110.75 4h2.5a.75.75 0 010 1.5h-2.5A.75.75 0 0110 4.75zM6.75 6.25A.75.75 0 017.5 5.5h5a.75.75 0 01.75.75v9a2.5 2.5 0 01-2.5 2.5h-1a2.5 2.5 0 01-2.5-2.5v-9z" clipRule="evenodd" /></svg>;


const DisabledStudentListPage = () => {
  const [disabledStudents, setDisabledStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const STUDENT_ADMIN_API_URL = `${API_BASE_URL}/admin/students`; // Usar URL base
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchDisabledStudents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${STUDENT_ADMIN_API_URL}?active=false`, { headers: { 'x-auth-token': token } });
      setDisabledStudents(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar estudiantes inhabilitados.');
      console.error("Error fetching disabled students:", err);
    } finally { setLoading(false); }
  }, [getToken, STUDENT_ADMIN_API_URL]);

  useEffect(() => { fetchDisabledStudents(); }, [fetchDisabledStudents]);

  // Estados para spinners de acciones (si se añaden más adelante)
  // const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  // const [isDeleting, setIsDeleting] = useState(false);

  const handleSetStudentStatus = async (studentId, isActive) => {
    // TODO: Considerar añadir spinner para esta acción si puede ser lenta
    const action = isActive ? "habilitar" : "inhabilitar";
    if (!window.confirm(`¿Está seguro que desea ${action} a este estudiante?`)) return;

    try {
      const token = getToken();
      await axios.put(`${STUDENT_ADMIN_API_URL}/${studentId}/set-status`, { is_active: isActive }, { headers: { 'x-auth-token': token }});
      fetchDisabledStudents();
      toast.success(`Estudiante ${action}do con éxito.`);
    } catch (err) {
      console.error(`Error ${action}ing student:`, err);
      toast.error(`Error: ${err.response?.data?.message || `No se pudo ${action} el estudiante.`}`);
    }
  };

  const handleDeletePermanent = async (studentId, studentName) => {
    // Considerar reemplazar window.confirm con un modal más estilizado
    if (!window.confirm(`¿ESTÁ ABSOLUTAMENTE SEGURO que desea ELIMINAR PERMANENTEMENTE a ${studentName} (${studentId})? Esta acción no se puede deshacer y borrará todos sus registros asociados.`)) return;
    if (!window.confirm(`Confirmación final: ¿Realmente desea ELIMINAR PERMANENTEMENTE a ${studentName}?`)) return;

    try {
      const token = getToken();
      await axios.delete(`${STUDENT_ADMIN_API_URL}/${studentId}/permanent-delete`, { headers: { 'x-auth-token': token }});
      fetchDisabledStudents();
      toast.success(`Estudiante ${studentName} (${studentId}) eliminado permanentemente.`);
    } catch (err) {
      console.error("Error deleting student permanently:", err);
      toast.error(`Error: ${err.response?.data?.message || 'No se pudo eliminar el estudiante.'}`);
    }
  };


  if (loading) {
    return (
      <div className="content-page-container loading-container">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/lista-estudiantes" className="back-link">&larr; Volver a Lista de Activos</Link>
        <Link to="/docente/dashboard" className="back-link" style={{marginLeft: 'auto'}}>Volver al Panel Principal</Link>
      </div>
      <h2 className="page-title">Alumnos Inhabilitados</h2>

      {error && <div className="error-message-page" style={{marginBottom: '1.5rem'}}>{error}</div>}

      {disabledStudents.length === 0 && !loading ? (
        <div className="empty-table-message">No hay estudiantes inhabilitados en este momento.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}> {/* Para hacer la tabla responsive horizontalmente */}
          <table className="styled-table">
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
                  <td style={{whiteSpace: 'nowrap'}}>
                    <button
                      onClick={() => handleSetStudentStatus(student.id, true)}
                      className="btn-action-row btn-success-row"
                    >
                      <EnableIcon /> Habilitar
                    </button>
                    <button
                      onClick={() => handleDeletePermanent(student.id, student.full_name)}
                      className="btn-action-row btn-danger-row"
                      style={{marginLeft: '0.5rem'}}
                    >
                      <TrashIcon/> Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DisabledStudentListPage;
