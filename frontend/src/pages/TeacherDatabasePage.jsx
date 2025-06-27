import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Iconos
const EditIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const SaveIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;


const TeacherDatabasePage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [showEditFullModal, setShowEditFullModal] = useState(false);
  const [currentStudentToEdit, setCurrentStudentToEdit] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Corrección: La importación dinámica no es ideal dentro del cuerpo del componente para una constante.
  // Se asume que config.js exporta API_BASE_URL directamente.
  // Si config.js es CJS (module.exports), necesitaría un manejo diferente o ser convertido a ESM.
  // Por ahora, vamos a importar estáticamente.
  // No es necesario importar API_BASE_URL aquí si config.js ya lo exporta y es usado por otros módulos que sí lo necesitan.
  // El TeacherDatabasePage usará la constante API_URL_BASE_FOR_STUDENTS que se define abajo.
  // import { API_BASE_URL } from '../../config'; // Comentado o eliminado si no se usa directamente aquí.

  // Definimos API_URL_BASE_FOR_STUDENTS usando la variable global VITE_API_BASE_URL o un fallback.
  // Esto asume que config.js no es necesario para este componente específico si solo define VITE_API_BASE_URL.
  // Si config.js hiciera más cosas, la importación sería necesaria.
  // Para mantenerlo simple y consistente con el uso previo de config.js:
  import { API_BASE_URL } from '../../config';
  const API_URL_BASE_FOR_STUDENTS = `${API_BASE_URL}/admin/students`;

  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchStudents = useCallback(async () => {
    setLoading(true); setError('');
    let url = API_URL_BASE_FOR_STUDENTS; // Usar la variable renombrada
    if (filter === 'active') url += '?active=true';
    else if (filter === 'inactive') url += '?active=false';
    try {
      const token = getToken();
      const response = await axios.get(url, { headers: { 'x-auth-token': token } });
      setStudents(response.data);
    } catch (err) { console.error("Error fetching students for database view:", err); setError(err.response?.data?.message || 'Error al cargar estudiantes.'); }
    finally { setLoading(false); }
  }, [getToken, API_URL_BASE_FOR_STUDENTS, filter]); // Añadir API_URL_BASE_FOR_STUDENTS a las dependencias

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : parseInt(value,10)) : value) }));
  };

  const handleOpenEditFullModal = (student) => {
    setCurrentStudentToEdit(student);
    const initialFormData = {
        full_name: student.full_name || '', nickname: student.nickname || '',
        is_active: student.is_active !== undefined ? student.is_active : true,
        age: student.age === null || student.age === undefined ? '' : student.age, // Para que el input number no muestre 0 si es null
        birth_date: student.birth_date ? student.birth_date.split('T')[0] : '',
        phone: student.phone || '', email: student.email || '',
        guardian_full_name: student.guardian_full_name || '', guardian_relationship: student.guardian_relationship || '',
        guardian_phone: student.guardian_phone || '', guardian_email: student.guardian_email || '',
        medical_conditions: student.medical_conditions || '', comments: student.comments || '',
        emergency_contact_name: student.emergency_contact_name || '', emergency_contact_phone: student.emergency_contact_phone || ''
    };
    setEditFormData(initialFormData);
    setShowEditFullModal(true);
  };

  const handleCloseEditFullModal = () => { setShowEditFullModal(false); setCurrentStudentToEdit(null); setEditFormData({}); };

  const handleSubmitEditFull = async (e) => {
    e.preventDefault();
    if (!currentStudentToEdit || !editFormData.full_name) { alert("Nombre Completo es requerido."); return; }
    const payload = { ...editFormData, age: editFormData.age === '' ? null : parseInt(editFormData.age, 10) };
    if (!payload.birth_date) payload.birth_date = null;

    try {
      const token = getToken();
      // Usar API_URL_BASE_FOR_STUDENTS para la URL de la solicitud PUT
      await axios.put(`${API_URL_BASE_FOR_STUDENTS}/${currentStudentToEdit.id}/edit-full`, payload, { headers: { 'x-auth-token': token } });
      fetchStudents();
      handleCloseEditFullModal();
      alert("Datos del estudiante actualizados con éxito.");
    } catch (err) { console.error("Error updating student (full):", err); alert(`Error: ${err.response?.data?.message || 'No se pudo actualizar el estudiante.'}`); }
  };

  const filteredStudents = students.filter(student => {
    const sTerm = searchTerm.toLowerCase();
    return (student.full_name.toLowerCase().includes(sTerm) || student.id.toLowerCase().includes(sTerm) ||
            (student.nickname && student.nickname.toLowerCase().includes(sTerm)) ||
            (student.email && student.email.toLowerCase().includes(sTerm)) );
  });

  const columns = [
    { key: 'id', header: 'ID' }, { key: 'full_name', header: 'Nombre Completo' }, { key: 'nickname', header: 'Apodo' },
    { key: 'email', header: 'Email' }, { key: 'phone', header: 'Celular' }, { key: 'age', header: 'Edad' },
    { key: 'birth_date', header: 'Fec. Nac.' , render: (val) => val ? new Date(val).toLocaleDateString('es-PE', {timeZone: 'UTC'}) : '-' }, //Asegurar UTC para fechas
    { key: 'is_active', header: 'Activo', render: (val) => val ? 'Sí' : 'No' },
  ];

  if (loading && students.length === 0) return <div className="content-page-container"><p className="text-center" style={{padding: '2rem'}}>Cargando base de datos de estudiantes...</p></div>;

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Base de Datos de Estudiantes</h2>

      <div className="controls-bar" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div className="control-group">
          <label htmlFor="filterActive" style={{marginBottom: 0}}>Filtrar por estado:</label>
          <select id="filterActive" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </div>
        <input
            type="text"
            placeholder="Buscar en tabla actual..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{maxWidth: '400px'}}
        />
      </div>

      {error && <div className="error-message-page" style={{marginBottom: '1.5rem'}}>{error}</div>}

      {filteredStudents.length === 0 && !loading ? (
        <div className="empty-table-message">No se encontraron estudiantes con los filtros y búsqueda actuales.</div>
      ) : (
        <div style={{overflowX: 'auto'}}>
          <table className="styled-table">
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
                  <td style={{whiteSpace: 'nowrap'}}>
                    <button onClick={() => handleOpenEditFullModal(student)} className="btn-action-row">
                      <EditIcon /> Editar Detallado
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showEditFullModal && currentStudentToEdit && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <h3>Editando: {currentStudentToEdit.full_name} ({currentStudentToEdit.id})</h3>
            <form onSubmit={handleSubmitEditFull}>
              <div className="modal-form-grid">
                <div className="form-group"><label>Nombre Completo:</label><input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditFormChange} required /></div>
                <div className="form-group"><label>Apodo:</label><input type="text" name="nickname" value={editFormData.nickname} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Email:</label><input type="email" name="email" value={editFormData.email} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Celular:</label><input type="tel" name="phone" value={editFormData.phone} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Edad:</label><input type="number" name="age" value={editFormData.age || ''} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Fecha Nacimiento:</label><input type="date" name="birth_date" value={editFormData.birth_date} onChange={handleEditFormChange} /></div>

                <div className="form-group"><label>Nombre Apoderado:</label><input type="text" name="guardian_full_name" value={editFormData.guardian_full_name} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Parentesco Apoderado:</label><input type="text" name="guardian_relationship" value={editFormData.guardian_relationship} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Celular Apoderado:</label><input type="tel" name="guardian_phone" value={editFormData.guardian_phone} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Email Apoderado:</label><input type="email" name="guardian_email" value={editFormData.guardian_email} onChange={handleEditFormChange} /></div>

                <div className="form-group"><label>Nombre Contacto Emergencia:</label><input type="text" name="emergency_contact_name" value={editFormData.emergency_contact_name} onChange={handleEditFormChange} /></div>
                <div className="form-group"><label>Celular Contacto Emergencia:</label><input type="tel" name="emergency_contact_phone" value={editFormData.emergency_contact_phone} onChange={handleEditFormChange} /></div>

                <div className="form-group full-width-grid"><label>Condiciones Médicas:</label><textarea name="medical_conditions" value={editFormData.medical_conditions} onChange={handleEditFormChange} rows="2"></textarea></div>
                <div className="form-group full-width-grid"><label>Comentarios Adicionales:</label><textarea name="comments" value={editFormData.comments} onChange={handleEditFormChange} rows="2"></textarea></div>

                <div className="form-group full-width-grid" style={{marginTop: '1rem'}}>
                  <label className="inline-label">
                    <input type="checkbox" name="is_active" checked={!!editFormData.is_active} onChange={handleEditFormChange} /> Estudiante Activo
                  </label>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseEditFullModal} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary"><SaveIcon /> Guardar Cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDatabasePage;
