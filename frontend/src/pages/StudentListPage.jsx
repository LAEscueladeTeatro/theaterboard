import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config'; // Importar URL base

// Iconos SVG (ejemplos)
const AddIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const DisableIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a.75.75 0 000 1.5h6a.75.75 0 000-1.5H7z" clipRule="evenodd" /></svg>;
const SaveIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;


const StudentListPage = () => {
  const [students, setStudents] = useState([]);
  const [allStudentsForSearch, setAllStudentsForSearch] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const [showAddQuickModal, setShowAddQuickModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);

  const [newStudentData, setNewStudentData] = useState({ full_name: '', nickname: '' });
  const [editStudentData, setEditStudentData] = useState({ id: '', full_name: '', nickname: '' });

  const STUDENT_ADMIN_API_URL = `${API_BASE_URL}/admin/students`; // Usar URL base
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchActiveStudents = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${STUDENT_ADMIN_API_URL}?active=true`, { headers: { 'x-auth-token': token } });
      setStudents(response.data);
      setAllStudentsForSearch(response.data);
    } catch (err) { setError(err.response?.data?.message || err.message || 'Error al cargar estudiantes activos.'); console.error("Error fetching active students:", err); }
    finally { setLoading(false); }
  }, [getToken, STUDENT_ADMIN_API_URL]);

  useEffect(() => { fetchActiveStudents(); }, [fetchActiveStudents]);

  useEffect(() => {
    if (!searchTerm) { setStudents(allStudentsForSearch); }
    else { const lowerSearchTerm = searchTerm.toLowerCase(); setStudents( allStudentsForSearch.filter( student => student.full_name.toLowerCase().includes(lowerSearchTerm) || student.id.toLowerCase().includes(lowerSearchTerm) ) ); }
  }, [searchTerm, allStudentsForSearch]);

  const handleOpenAddQuickModal = () => { setNewStudentData({ full_name: '', nickname: '' }); setShowAddQuickModal(true); };
  const handleCloseAddQuickModal = () => setShowAddQuickModal(false);

  const handleAddQuickStudent = async (e) => {
    e.preventDefault();
    if (!newStudentData.full_name) { alert("Nombre Completo es requerido."); return; }
    try {
      const token = getToken();
      const payload = { full_name: newStudentData.full_name, nickname: newStudentData.nickname };
      await axios.post(`${STUDENT_ADMIN_API_URL}/add-quick`, payload, { headers: { 'x-auth-token': token }});
      fetchActiveStudents();
      handleCloseAddQuickModal();
      alert("Estudiante añadido con éxito.");
    } catch (err) { console.error("Error adding student (quick):", err); alert(`Error: ${err.response?.data?.message || 'No se pudo añadir el estudiante.'}`); }
  };

  const handleOpenEditModal = (student) => { setCurrentStudent(student); setEditStudentData({ id: student.id, full_name: student.full_name, nickname: student.nickname || '' }); setShowEditModal(true); };
  const handleCloseEditModal = () => { setShowEditModal(false); setCurrentStudent(null); setEditStudentData({ id: '', full_name: '', nickname: '' }); };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editStudentData.full_name) { alert("Nombre Completo es requerido."); return; }
    if (!currentStudent) return;
    try {
      const token = getToken();
      const payload = { full_name: editStudentData.full_name, nickname: editStudentData.nickname };
      await axios.put(`${STUDENT_ADMIN_API_URL}/${currentStudent.id}/edit-basic`, payload, { headers: { 'x-auth-token': token }});
      fetchActiveStudents();
      handleCloseEditModal();
      alert("Estudiante actualizado con éxito.");
    } catch (err) { console.error("Error updating student:", err); alert(`Error: ${err.response?.data?.message || 'No se pudo actualizar el estudiante.'}`); }
  };

  const handleSetStudentStatus = async (studentId, isActive) => {
    const action = isActive ? "habilitar" : "inhabilitar";
    if (!window.confirm(`¿Está seguro que desea ${action} a este estudiante?`)) return;
    try {
      const token = getToken();
      await axios.put(`${STUDENT_ADMIN_API_URL}/${studentId}/set-status`, { is_active: isActive }, { headers: { 'x-auth-token': token }});
      fetchActiveStudents();
      alert(`Estudiante ${action}do con éxito.`);
    } catch (err) { console.error(`Error ${action}ing student:`, err); alert(`Error: ${err.response?.data?.message || `No se pudo ${action} el estudiante.`}`); }
  };

  if (loading && students.length === 0) return <div className="content-page-container"><p className="text-center" style={{padding: '2rem'}}>Cargando lista de estudiantes...</p></div>;
  if (error && !loading) return <div className="content-page-container"><div className="error-message-page">{error}</div><div style={{textAlign:'center', marginTop:'1rem'}}><Link to="/docente/dashboard" className="btn-action btn-student">Volver al Panel</Link></div></div>;

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Lista de Estudiantes Activos</h2>

      <div className="controls-bar" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleOpenAddQuickModal} className="btn-action btn-teacher">
            <AddIcon /> Añadir Estudiante
          </button>
          <Link to="/docente/lista-estudiantes/inhabilitados" className="btn-action" style={{backgroundColor: 'var(--input-background-focus)', minWidth: 'auto'}}>
            Ver Inhabilitados
          </Link>
        </div>
        <input
          type="text"
          placeholder="Buscar por ID o Nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ maxWidth: '350px' }}
        />
      </div>

      {error && <div className="error-message-page">{error}</div>}

      {students.length === 0 && !loading ? (
        <div className="empty-table-message">No se encontraron estudiantes activos{searchTerm && ` con el término "${searchTerm}"`}.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
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
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.id}</td>
                  <td>{student.full_name}</td>
                  <td>{student.nickname || '-'}</td>
                  <td style={{whiteSpace: 'nowrap'}}>
                    <button onClick={() => handleOpenEditModal(student)} className="btn-action-row">
                      <EditIcon /> Editar
                    </button>
                    <button onClick={() => handleSetStudentStatus(student.id, false)} className="btn-action-row btn-danger-row">
                      <DisableIcon /> Inhabilitar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddQuickModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Añadir Estudiante (Rápido)</h3>
            <form onSubmit={handleAddQuickStudent}>
              <div className="form-group">
                <label htmlFor="newFullName">Nombre Completo:</label>
                <input type="text" id="newFullName" value={newStudentData.full_name} onChange={(e) => setNewStudentData({...newStudentData, full_name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label htmlFor="newNickname">Sobrenombre:</label>
                <input type="text" id="newNickname" value={newStudentData.nickname} onChange={(e) => setNewStudentData({...newStudentData, nickname: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseAddQuickModal} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary"><SaveIcon /> Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && currentStudent && (
         <div className="modal-overlay">
         <div className="modal-content">
           <h3>Editar Estudiante: {currentStudent.full_name} ({currentStudent.id})</h3>
           <form onSubmit={handleUpdateStudent}>
             <div className="form-group">
               <label htmlFor="editFullName">Nombre Completo:</label>
               <input type="text" id="editFullName" value={editStudentData.full_name} onChange={(e) => setEditStudentData({...editStudentData, full_name: e.target.value})} required />
             </div>
             <div className="form-group">
               <label htmlFor="editNickname">Sobrenombre:</label>
               <input type="text" id="editNickname" value={editStudentData.nickname} onChange={(e) => setEditStudentData({...editStudentData, nickname: e.target.value})} />
             </div>
             <div className="modal-actions">
               <button type="button" onClick={handleCloseEditModal} className="btn-secondary">Cancelar</button>
               <button type="submit" className="btn-primary"><SaveIcon /> Actualizar</button>
             </div>
           </form>
         </div>
       </div>
      )}
    </div>
  );
};

export default StudentListPage;
