import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TeacherDatabasePage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [searchTerm, setSearchTerm] = useState('');

  // Estados para el modal de edición completa
  const [showEditFullModal, setShowEditFullModal] = useState(false);
  const [currentStudentToEdit, setCurrentStudentToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  const API_URL = 'http://localhost:3001/api/admin/students';
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    let url = API_URL;
    if (filter === 'active') {
      url += '?active=true';
    } else if (filter === 'inactive') {
      url += '?active=false';
    }
    // Si filter es 'all', no se añade query param, el backend devuelve todos.

    try {
      const token = getToken();
      const response = await axios.get(url, { headers: { 'x-auth-token': token } });
      setStudents(response.data);
    } catch (err) {
      console.error("Error fetching students for database view:", err);
      setError(err.response?.data?.message || 'Error al cargar estudiantes.');
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL, filter]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value,10) || null : value)
    }));
  };

  const handleOpenEditFullModal = (student) => {
    setCurrentStudentToEdit(student);
    // Asegurarse de que todos los campos, incluso los opcionales, tengan un valor inicial (string vacío o null)
    const initialFormData = {
        full_name: student.full_name || '',
        nickname: student.nickname || '',
        is_active: student.is_active !== undefined ? student.is_active : true,
        age: student.age || null,
        birth_date: student.birth_date ? student.birth_date.split('T')[0] : '', // Formato YYYY-MM-DD para input date
        phone: student.phone || '',
        email: student.email || '',
        guardian_full_name: student.guardian_full_name || '',
        guardian_relationship: student.guardian_relationship || '',
        guardian_phone: student.guardian_phone || '',
        guardian_email: student.guardian_email || '',
        medical_conditions: student.medical_conditions || '',
        comments: student.comments || '',
        emergency_contact_name: student.emergency_contact_name || '',
        emergency_contact_phone: student.emergency_contact_phone || ''
    };
    setEditFormData(initialFormData);
    setShowEditFullModal(true);
  };

  const handleCloseEditFullModal = () => {
    setShowEditFullModal(false);
    setCurrentStudentToEdit(null);
    setEditFormData({});
  };

  const handleSubmitEditFull = async (e) => {
    e.preventDefault();
    if (!currentStudentToEdit) return;

    // Validaciones básicas del lado del cliente (se pueden expandir)
    if (!editFormData.full_name || editFormData.email === undefined) { // email puede ser null pero no undefined si se envía
        alert("Nombre Completo y Email son campos importantes.");
        return;
    }

    // Asegurar que age sea número o null
    const payload = {
        ...editFormData,
        age: editFormData.age ? parseInt(editFormData.age, 10) : null,
    };
    // Remover campos que no deben enviarse si están vacíos y son opcionales, o asegurar que el backend los maneje
    // Por ejemplo, si birth_date está vacío, enviarlo como null
    if (!payload.birth_date) payload.birth_date = null;


    try {
      const token = getToken();
      await axios.put(`${API_URL}/${currentStudentToEdit.id}/edit-full`, payload, { headers: { 'x-auth-token': token } });
      fetchStudents(); // Recargar
      handleCloseEditFullModal();
      alert("Datos del estudiante actualizados con éxito.");
    } catch (err) {
      console.error("Error updating student (full):", err);
      alert(`Error: ${err.response?.data?.message || 'No se pudo actualizar el estudiante.'}`);
    }
  };

  const filteredStudents = students.filter(student => {
    const sTerm = searchTerm.toLowerCase();
    return (
      student.full_name.toLowerCase().includes(sTerm) ||
      student.id.toLowerCase().includes(sTerm) ||
      (student.nickname && student.nickname.toLowerCase().includes(sTerm)) ||
      (student.email && student.email.toLowerCase().includes(sTerm))
    );
  });

  // Columnas a mostrar (se pueden seleccionar más o menos)
  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Nombre Completo' },
    { key: 'nickname', header: 'Apodo' },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Celular' },
    { key: 'age', header: 'Edad' },
    { key: 'birth_date', header: 'Fec. Nac.' , render: (val) => val ? new Date(val).toLocaleDateString('es-PE') : '-' },
    { key: 'is_active', header: 'Activo', render: (val) => val ? 'Sí' : 'No' },
  ];


  if (loading && students.length === 0) return <p>Cargando base de datos de estudiantes...</p>;

  return (
    <div>
      <h2>Base de Datos de Estudiantes</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>

      <div style={{ margin: '15px 0' }}>
        <label htmlFor="filterActive">Filtrar por estado: </label>
        <select id="filterActive" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Todos</option>
          <option value="active">Activos</option>
          <option value="inactive">Inactivos</option>
        </select>
        <input
            type="text"
            placeholder="Buscar por ID, Nombre, Apodo, Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ marginLeft: '20px', padding: '8px', width: '300px' }}
        />
      </div>

      {error && <p style={{color: 'red'}}>Error: {error}</p>}

      {filteredStudents.length === 0 && !loading ? (
        <p>No se encontraron estudiantes con los filtros actuales.</p>
      ) : (
        <div style={{overflowX: 'auto'}}> {/* Para tablas anchas */}
        <table border="1" style={{width: '100%', borderCollapse: 'collapse', marginTop: '10px'}}>
          <thead>
            <tr>
              {columns.map(col => <th key={col.key}>{col.header}</th>)}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map((student) => (
              <tr key={student.id}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(student[col.key]) : (student[col.key] === null || student[col.key] === undefined ? '-' : String(student[col.key]))}
                  </td>
                ))}
                <td>
                  <button onClick={() => handleOpenEditFullModal(student)}>Editar Completo</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}

      {/* Modal para Edición Completa */}
      {showEditFullModal && currentStudentToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <h3>Editando: {currentStudentToEdit.full_name} ({currentStudentToEdit.id})</h3>
            <form onSubmit={handleSubmitEditFull}>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px'}}>
                <div><label>Nombre Completo:</label><input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditFormChange} required /></div>
                <div><label>Apodo:</label><input type="text" name="nickname" value={editFormData.nickname} onChange={handleEditFormChange} /></div>
                <div><label>Email:</label><input type="email" name="email" value={editFormData.email} onChange={handleEditFormChange} /></div>
                <div><label>Celular:</label><input type="tel" name="phone" value={editFormData.phone} onChange={handleEditFormChange} /></div>
                <div><label>Edad:</label><input type="number" name="age" value={editFormData.age || ''} onChange={handleEditFormChange} /></div>
                <div><label>Fecha Nacimiento:</label><input type="date" name="birth_date" value={editFormData.birth_date} onChange={handleEditFormChange} /></div>

                <div><label>Nombre Apoderado:</label><input type="text" name="guardian_full_name" value={editFormData.guardian_full_name} onChange={handleEditFormChange} /></div>
                <div><label>Parentesco Apoderado:</label><input type="text" name="guardian_relationship" value={editFormData.guardian_relationship} onChange={handleEditFormChange} /></div>
                <div><label>Celular Apoderado:</label><input type="tel" name="guardian_phone" value={editFormData.guardian_phone} onChange={handleEditFormChange} /></div>
                <div><label>Email Apoderado:</label><input type="email" name="guardian_email" value={editFormData.guardian_email} onChange={handleEditFormChange} /></div>

                <div><label>Nombre Contacto Emergencia:</label><input type="text" name="emergency_contact_name" value={editFormData.emergency_contact_name} onChange={handleEditFormChange} /></div>
                <div><label>Celular Contacto Emergencia:</label><input type="tel" name="emergency_contact_phone" value={editFormData.emergency_contact_phone} onChange={handleEditFormChange} /></div>

                <div style={{gridColumn: '1 / -1'}}><label>Condiciones Médicas:</label><textarea name="medical_conditions" value={editFormData.medical_conditions} onChange={handleEditFormChange} rows="2"></textarea></div>
                <div style={{gridColumn: '1 / -1'}}><label>Comentarios Adicionales:</label><textarea name="comments" value={editFormData.comments} onChange={handleEditFormChange} rows="2"></textarea></div>

                <div style={{gridColumn: '1 / -1'}}><label><input type="checkbox" name="is_active" checked={editFormData.is_active} onChange={handleEditFormChange} /> Estudiante Activo</label></div>
              </div>
              <div style={{marginTop:'20px', textAlign: 'right'}}>
                <button type="submit" className="primary">Guardar Cambios</button>
                <button type="button" onClick={handleCloseEditFullModal} className="secondary" style={{marginLeft:'10px'}}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
       {/* Estilos del modal (reutilizados) */}
       <style jsx="true" global="true">{`
        .modal-overlay {
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background-color: rgba(0, 0, 0, 0.6); display: flex;
          align-items: center; justify-content: center; z-index: 1050;
        }
        .modal-content {
          background-color: white; padding: 20px; border-radius: 8px;
          min-width: 350px; max-width: 700px; /* Aumentado para más campos */
          box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        .modal-content h3 { margin-top: 0; }
        .modal-content div { margin-bottom: 10px; }
        .modal-content label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9em; }
        .modal-content input[type="text"],
        .modal-content input[type="number"],
        .modal-content input[type="email"],
        .modal-content input[type="tel"],
        .modal-content input[type="date"],
        .modal-content textarea {
          width: calc(100% - 16px); padding: 8px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box;
        }
        .modal-content button.primary { background-color: #007bff; color: white; padding: 8px 15px; border:none; border-radius:4px; cursor:pointer; }
        .modal-content button.secondary { background-color: #6c757d; color: white; padding: 8px 15px; border:none; border-radius:4px; cursor:pointer; }
      `}</style>
    </div>
  );
};

export default TeacherDatabasePage;
