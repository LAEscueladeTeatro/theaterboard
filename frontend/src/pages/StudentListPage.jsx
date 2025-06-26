import React, { useState, useEffect, useCallback } from 'react'; // Añadir useCallback
import axios from 'axios';
import { Link } from 'react-router-dom'; // Para volver al dashboard

import { useNavigate } from 'react-router-dom'; // Para el enlace a inhabilitados

const StudentListPage = () => {
  const [students, setStudents] = useState([]); // Estudiantes activos
  const [allStudentsForSearch, setAllStudentsForSearch] = useState([]); // Para la búsqueda local
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  // Estados para Modales
  const [showAddQuickModal, setShowAddQuickModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null); // Para edición

  // Estados para formularios de modales
  const [newStudentData, setNewStudentData] = useState({ id: '', full_name: '', nickname: '' });
  const [editStudentData, setEditStudentData] = useState({ id: '', full_name: '', nickname: '' });

  const API_URL = 'http://localhost:3001/api/admin/students';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchActiveStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const response = await axios.get(`${API_URL}?active=true`, {
        headers: { 'x-auth-token': token },
      });
      setStudents(response.data);
      setAllStudentsForSearch(response.data); // Guardar para búsqueda
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al cargar estudiantes activos.');
      console.error("Error fetching active students:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL]);

  useEffect(() => {
    fetchActiveStudents();
  }, [fetchActiveStudents]);

  // Filtrado para búsqueda local
  useEffect(() => {
    if (!searchTerm) {
      setStudents(allStudentsForSearch);
    } else {
      const lowerSearchTerm = searchTerm.toLowerCase();
      setStudents(
        allStudentsForSearch.filter(
          student =>
            student.full_name.toLowerCase().includes(lowerSearchTerm) ||
            student.id.toLowerCase().includes(lowerSearchTerm)
        )
      );
    }
  }, [searchTerm, allStudentsForSearch]);


  if (loading && students.length === 0) { // Mostrar carga solo si no hay datos previos
    return <p>Cargando lista de estudiantes...</p>;
  }

  // Handlers para Modales y Acciones CRUD
  const handleOpenAddQuickModal = () => {
    setNewStudentData({ full_name: '', nickname: '' }); // Resetear form, ID ya no se maneja aquí
    setShowAddQuickModal(true);
  };
  const handleCloseAddQuickModal = () => setShowAddQuickModal(false);

  const handleAddQuickStudent = async (e) => {
    e.preventDefault();
    // ID ya no se valida aquí, se genera en backend
    if (!newStudentData.full_name) {
      alert("Nombre Completo es requerido.");
      return;
    }
    try {
      const token = getToken();
      // Enviar solo full_name y nickname. El backend generará el ID y la contraseña.
      const payload = { full_name: newStudentData.full_name, nickname: newStudentData.nickname };
      await axios.post(`${API_URL}/add-quick`, payload, { headers: { 'x-auth-token': token }});
      fetchActiveStudents(); // O mejor, recargar la lista para asegurar consistencia
      handleCloseAddQuickModal();
      alert("Estudiante añadido con éxito.");
    } catch (err) {
      console.error("Error adding student (quick):", err);
      alert(`Error: ${err.response?.data?.message || 'No se pudo añadir el estudiante.'}`);
    }
  };

  const handleOpenEditModal = (student) => {
    setCurrentStudent(student);
    setEditStudentData({ id: student.id, full_name: student.full_name, nickname: student.nickname || '' });
    setShowEditModal(true);
  };
  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setCurrentStudent(null);
    setEditStudentData({ id: '', full_name: '', nickname: '' });
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editStudentData.full_name) {
      alert("Nombre Completo es requerido.");
      return;
    }
    if (!currentStudent) return;

    try {
      const token = getToken();
      const payload = { full_name: editStudentData.full_name, nickname: editStudentData.nickname };
      await axios.put(`${API_URL}/${currentStudent.id}/edit-basic`, payload, { headers: { 'x-auth-token': token }});
      fetchActiveStudents(); // Recargar lista
      handleCloseEditModal();
      alert("Estudiante actualizado con éxito.");
    } catch (err) {
      console.error("Error updating student:", err);
      alert(`Error: ${err.response?.data?.message || 'No se pudo actualizar el estudiante.'}`);
    }
  };

  const handleSetStudentStatus = async (studentId, isActive) => {
    const action = isActive ? "habilitar" : "inhabilitar";
    if (!window.confirm(`¿Está seguro que desea ${action} a este estudiante?`)) return;

    try {
      const token = getToken();
      await axios.put(`${API_URL}/${studentId}/set-status`, { is_active: isActive }, { headers: { 'x-auth-token': token }});
      fetchActiveStudents(); // Recargar lista de estudiantes activos
      alert(`Estudiante ${action}do con éxito.`);
    } catch (err) {
      console.error(`Error ${action}ing student:`, err);
      alert(`Error: ${err.response?.data?.message || `No se pudo ${action} el estudiante.`}`);
    }
  };


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
      <h2>Lista de Estudiantes Activos</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>

      <div style={{ margin: '15px 0' }}>
        <button onClick={handleOpenAddQuickModal}>Añadir Estudiante (Rápido)</button>
        {/* <button onClick={handleOpenAddFullModal} disabled>Añadir Estudiante (Completo)</button> */}
        <Link to="/docente/lista-estudiantes/inhabilitados" style={{ marginLeft: '15px' }}>
          Ver Alumnos Inhabilitados
        </Link>
      </div>

      <input
        type="text"
        placeholder="Buscar por ID o Nombre..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ margin: '10px 0', padding: '8px', width: '300px' }}
      />

      {students.length === 0 && !loading ? (
        <p>No se encontraron estudiantes activos.</p>
      ) : (
        <table border="1" style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
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
                <td>
                  <button onClick={() => handleOpenEditModal(student)} style={{marginRight: '5px'}}>Editar</button>
                  <button onClick={() => handleSetStudentStatus(student.id, false)}>Inhabilitar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Modal para Añadir Rápido */}
      {showAddQuickModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Añadir Estudiante (Rápido)</h3>
            <form onSubmit={handleAddQuickStudent}>
              {/* ID se genera automáticamente en el backend, no se pide aquí */}
              <div style={{marginTop:'5px'}}>
                <label htmlFor="newFullName">Nombre Completo:</label>
                <input type="text" id="newFullName" value={newStudentData.full_name} onChange={(e) => setNewStudentData({...newStudentData, full_name: e.target.value})} required />
              </div>
              <div style={{marginTop:'5px'}}>
                <label htmlFor="newNickname">Sobrenombre:</label>
                <input type="text" id="newNickname" value={newStudentData.nickname} onChange={(e) => setNewStudentData({...newStudentData, nickname: e.target.value})} />
              </div>
              <div style={{marginTop:'15px'}}>
                <button type="submit" className="primary">Guardar</button>
                <button type="button" onClick={handleCloseAddQuickModal} className="secondary" style={{marginLeft:'10px'}}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Editar Estudiante */}
      {showEditModal && currentStudent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Estudiante: {currentStudent.full_name} ({currentStudent.id})</h3>
            <form onSubmit={handleUpdateStudent}>
              {/* ID no es editable aquí, pero se podría mostrar */}
              {/* <div><label>ID:</label> <input type="text" value={editStudentData.id} readOnly disabled /></div> */}
              <div style={{marginTop:'5px'}}>
                <label htmlFor="editFullName">Nombre Completo:</label>
                <input type="text" id="editFullName" value={editStudentData.full_name} onChange={(e) => setEditStudentData({...editStudentData, full_name: e.target.value})} required />
              </div>
              <div style={{marginTop:'5px'}}>
                <label htmlFor="editNickname">Sobrenombre:</label>
                <input type="text" id="editNickname" value={editStudentData.nickname} onChange={(e) => setEditStudentData({...editStudentData, nickname: e.target.value})} />
              </div>
              <div style={{marginTop:'15px'}}>
                <button type="submit" className="primary">Actualizar</button>
                <button type="button" onClick={handleCloseEditModal} className="secondary" style={{marginLeft:'10px'}}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Estilos del modal (copiados de TeacherAttendancePage, idealmente en un CSS global) */}
      <style jsx global>{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.6); display: flex;
          align-items: center; justify-content: center; z-index: 1050;
        }
        .modal-content {
          background-color: white; padding: 20px; border-radius: 8px;
          min-width: 350px; max-width: 500px; box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .modal-content h3 { margin-top: 0; }
        .modal-content div { margin-bottom: 10px; }
        .modal-content label { display: block; margin-bottom: 5px; font-weight: bold; }
        .modal-content input[type="text"], .modal-content input[type="number"] {
          width: calc(100% - 16px); padding: 8px; border: 1px solid #ccc; border-radius: 4px;
        }
        .modal-content button.primary { background-color: #007bff; color: white; padding: 8px 15px; border:none; border-radius:4px; cursor:pointer; }
        .modal-content button.secondary { background-color: #6c757d; color: white; padding: 8px 15px; border:none; border-radius:4px; cursor:pointer; }
      `}</style>

    </div>
  );
};

export default StudentListPage;
