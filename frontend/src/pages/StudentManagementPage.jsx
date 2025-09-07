import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { GroupContext } from '../context/GroupContext';
import { API_BASE_URL } from '../config';
import FaceRegistration from '../components/FaceRegistration';
import ConfirmationModal from '../components/ConfirmationModal';
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast';

// Iconos
const AddIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>;
const EditIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M5.433 13.917l1.262-3.155A4 4 0 017.58 9.42l6.92-6.918a2.121 2.121 0 013 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 01-.65-.65z" /><path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0010 3H4.75A2.75 2.75 0 002 5.75v9.5A2.75 2.75 0 004.75 18h9.5A2.75 2.75 0 0017 15.25V10a.75.75 0 00-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5z" /></svg>;
const SaveIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;
const FaceIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{ verticalAlign: 'middle', marginRight: '0.5em' }}><path d="M10 9a3 3 0 100-6 3 3 0 000 6z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.056 13.878a6 6 0 118.944 0A8.002 8.002 0 0010 16a8.002 8.002 0 00-5.944-2.122z" clipRule="evenodd" /></svg>;
const ToggleIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1.03-5.22.01-1.56a.75.75 0 011.5-.02v1.57l.01.02a.75.75 0 01-1.52-.01zM8.25 8a.75.75 0 01.75-.75h2a.75.75 0 010 1.5h-2a.75.75 0 01-.75-.75z" clipRule="evenodd" /></svg>;

const API_URL_BASE_FOR_STUDENTS = `${API_BASE_URL}/admin/students`;

const StudentManagementPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('active'); // Default to active students
  const [searchTerm, setSearchTerm] = useState('');

  // State for modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showFaceRegistrationModal, setShowFaceRegistrationModal] = useState(false);

  // State for modal data
  const [newStudentData, setNewStudentData] = useState({ full_name: '', nickname: '', group_id: '' });
  const [currentStudent, setCurrentStudent] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [studentForFaceRegistration, setStudentForFaceRegistration] = useState(null);
  const [studentToToggleStatus, setStudentToToggleStatus] = useState(null);
  const [editTab, setEditTab] = useState('basic'); // 'basic' or 'complete'
  const [groups, setGroups] = useState([]);

  // Loading states for actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const { selectedGroupId } = useContext(GroupContext);


  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
        const token = getToken();
        const params = new URLSearchParams();
        if (filter !== 'all') {
            params.append('active', filter === 'active');
        }
        if (selectedGroupId && selectedGroupId !== 'all') {
            params.append('group_id', selectedGroupId);
        }

        const { data } = await axios.get(API_URL_BASE_FOR_STUDENTS, {
            headers: { 'x-auth-token': token },
            params
        });
        setStudents(data);
    } catch (err) {
        console.error("Error fetching students:", err);
        setError(err.response?.data?.message || 'Error al cargar estudiantes.');
    } finally {
        setLoading(false);
    }
  }, [getToken, filter, selectedGroupId]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(`${API_BASE_URL}/groups`, {
          headers: { 'x-auth-token': token },
        });
        setGroups(data);
      } catch (err) {
        console.error("Error fetching groups:", err);
        toast.error("No se pudo cargar la lista de grupos.");
      }
    };
    fetchGroups();
  }, [fetchStudents, getToken]);

  const handleAddQuickStudent = async (e) => {
    e.preventDefault();
    if (!newStudentData.full_name) {
      toast.error("El nombre completo es requerido.");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = getToken();
      const payload = {
        full_name: newStudentData.full_name,
        nickname: newStudentData.nickname,
        group_id: newStudentData.group_id || null
      };
      await axios.post(`${API_URL_BASE_FOR_STUDENTS}/add-quick`, payload, { headers: { 'x-auth-token': token }});
      toast.success("Estudiante añadido con éxito.");
      setShowAddModal(false);
      setNewStudentData({ full_name: '', nickname: '', group_id: '' });
      fetchStudents(); // Reload students
    } catch (err) {
      console.error("Error adding student (quick):", err);
      toast.error(`Error: ${err.response?.data?.message || 'No se pudo añadir el estudiante.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? null : parseInt(value,10)) : value) }));
  };

  const handleOpenEditModal = (student) => {
    setCurrentStudent(student);
    setEditTab('basic'); // Reset to basic tab each time
    const initialFormData = {
        full_name: student.full_name || '', nickname: student.nickname || '',
        is_active: student.is_active !== undefined ? student.is_active : true,
        age: student.age === null || student.age === undefined ? '' : student.age,
        birth_date: student.birth_date ? student.birth_date.split('T')[0] : '',
        phone: student.phone || '', email: student.email || '',
        guardian_full_name: student.guardian_full_name || '', guardian_relationship: student.guardian_relationship || '',
        guardian_phone: student.guardian_phone || '', guardian_email: student.guardian_email || '',
        medical_conditions: student.medical_conditions || '', comments: student.comments || '',
        emergency_contact_name: student.emergency_contact_name || '', emergency_contact_phone: student.emergency_contact_phone || '',
        group_id: student.group_id || ''
    };
    setEditFormData(initialFormData);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => { setShowEditModal(false); setCurrentStudent(null); setEditFormData({}); setEditTab('basic'); };

  const handleOpenFaceRegistrationModal = (student) => {
    setStudentForFaceRegistration(student);
    setShowFaceRegistrationModal(true);
  };

  const handleCloseFaceRegistrationModal = () => {
    setShowFaceRegistrationModal(false);
    setStudentForFaceRegistration(null);
  };

  const handleOpenToggleStatusModal = (student) => {
    setStudentToToggleStatus(student);
    setShowDisableModal(true);
  };

  const handleToggleStudentStatus = async () => {
    if (!studentToToggleStatus) return;
    setIsTogglingStatus(true);
    try {
      const token = getToken();
      const newStatus = !studentToToggleStatus.is_active;
      await axios.put(`${API_URL_BASE_FOR_STUDENTS}/${studentToToggleStatus.id}/set-status`, { is_active: newStatus }, { headers: { 'x-auth-token': token }});
      toast.success(`Estudiante ${studentToToggleStatus.full_name} ${newStatus ? 'habilitado' : 'inhabilitado'} con éxito.`);
      setShowDisableModal(false);
      fetchStudents(); // Recargar la lista de estudiantes
    } catch (err) {
      console.error(`Error toggling student status:`, err);
      toast.error(`Error: ${err.response?.data?.message || `No se pudo cambiar el estado del estudiante.`}`);
    } finally {
      setIsTogglingStatus(false);
      setStudentToToggleStatus(null);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    if (!currentStudent || !editFormData.full_name) { toast.error("Nombre Completo es requerido."); return; }
    const payload = { ...editFormData, age: editFormData.age === '' ? null : parseInt(editFormData.age, 10), group_id: editFormData.group_id || null };
    if (!payload.birth_date) payload.birth_date = null;

    setIsSubmitting(true);
    try {
      const token = getToken();
      await axios.put(`${API_URL_BASE_FOR_STUDENTS}/${currentStudent.id}/edit-full`, payload, { headers: { 'x-auth-token': token } });
      toast.success("Datos del estudiante actualizados con éxito.");
      fetchStudents();
      handleCloseEditModal();
    } catch (err) { console.error("Error updating student (full):", err); toast.error(`Error: ${err.response?.data?.message || 'No se pudo actualizar el estudiante.'}`); }
    finally { setIsSubmitting(false); }
  };

  const filteredStudents = students.filter(student => {
    const sTerm = searchTerm.toLowerCase();
    return (student.full_name.toLowerCase().includes(sTerm) || student.id.toLowerCase().includes(sTerm) || (student.nickname && student.nickname.toLowerCase().includes(sTerm)));
  });

  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'full_name', header: 'Nombre Completo' },
    { key: 'nickname', header: 'Apodo' },
    { key: 'group_name', header: 'Grupo', render: (val) => val || 'Sin Asignar' },
  ];

  if (loading && students.length === 0) return <div className="content-page-container"><Spinner /></div>;

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Gestión de Estudiantes</h2>

      <div className="controls-bar" style={{ justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => setShowAddModal(true)} className="btn-action btn-teacher">
                <AddIcon /> Añadir Estudiante
            </button>
            <div className="control-group">
                <label htmlFor="filterActive" style={{marginBottom: 0}}>Filtrar:</label>
                <select id="filterActive" value={filter} onChange={(e) => setFilter(e.target.value)}>
                    <option value="active">Activos</option>
                    <option value="inactive">Inactivos</option>
                    <option value="all">Todos</option>
                </select>
            </div>
        </div>
        <input
            type="text"
            placeholder="Buscar por ID o Nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{maxWidth: '350px'}}
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
                    <button onClick={() => handleOpenEditModal(student)} className="btn-action-row">
                      <EditIcon /> Editar
                    </button>
                    <button onClick={() => handleOpenToggleStatusModal(student)} className={`btn-action-row ${student.is_active ? 'btn-danger-row' : ''}`}>
                      <ToggleIcon /> {student.is_active ? 'Inhabilitar' : 'Habilitar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
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
              <div className="form-group">
                <label htmlFor="newGroup">Grupo:</label>
                <select id="newGroup" name="group_id" value={newStudentData.group_id || ''} onChange={(e) => setNewStudentData({...newStudentData, group_id: e.target.value})}>
                    <option value="">Sin Asignar</option>
                    {groups.map(group => (
                        <option key={group.group_id} value={group.group_id}>{group.name}</option>
                    ))}
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancelar</button>
                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="20px" /> : <><SaveIcon /> Guardar</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditModal && currentStudent && (
        <div className="modal-overlay">
          <div className="modal-content large-modal" style={{maxHeight: '90vh', overflowY: 'auto'}}>
            <h3>Editando: {currentStudent.full_name} ({currentStudent.id})</h3>

            <div className="modal-tabs">
              <button className={`tab-button ${editTab === 'basic' ? 'active' : ''}`} onClick={() => setEditTab('basic')}>Básico</button>
              <button className={`tab-button ${editTab === 'complete' ? 'active' : ''}`} onClick={() => setEditTab('complete')}>Completo</button>
            </div>

            <form onSubmit={handleSubmitEdit}>
              <div className="modal-tab-content">
                {editTab === 'basic' && (
                  <div className="modal-form-grid">
                    <div className="form-group"><label>Nombre Completo:</label><input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditFormChange} required /></div>
                    <div className="form-group"><label>Apodo:</label><input type="text" name="nickname" value={editFormData.nickname} onChange={handleEditFormChange} /></div>
                    <div className="form-group">
                        <label htmlFor="editGroup">Grupo:</label>
                        <select id="editGroup" name="group_id" value={editFormData.group_id || ''} onChange={handleEditFormChange}>
                            <option value="">Sin Asignar</option>
                            {groups.map(group => (
                                <option key={group.group_id} value={group.group_id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                  </div>
                )}

                {editTab === 'complete' && (
                  <div className="modal-form-grid">
                    {/* Basic Info also in Complete Tab */}
                    <div className="form-group"><label>Nombre Completo:</label><input type="text" name="full_name" value={editFormData.full_name} onChange={handleEditFormChange} required /></div>
                    <div className="form-group"><label>Apodo:</label><input type="text" name="nickname" value={editFormData.nickname} onChange={handleEditFormChange} /></div>

                    <hr className="full-width-grid-hr" />

                    <div className="form-group">
                        <label htmlFor="editGroupComplete">Grupo:</label>
                        <select id="editGroupComplete" name="group_id" value={editFormData.group_id || ''} onChange={handleEditFormChange}>
                            <option value="">Sin Asignar</option>
                            {groups.map(group => (
                                <option key={group.group_id} value={group.group_id}>{group.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group"><label>Email:</label><input type="email" name="email" value={editFormData.email} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Celular:</label><input type="tel" name="phone" value={editFormData.phone} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Edad:</label><input type="number" name="age" value={editFormData.age || ''} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Fecha Nacimiento:</label><input type="date" name="birth_date" value={editFormData.birth_date} onChange={handleEditFormChange} /></div>

                    <hr className="full-width-grid-hr" />
                    <h4 className="full-width-grid-h4">Información del Apoderado</h4>
                    <div className="form-group"><label>Nombre Apoderado:</label><input type="text" name="guardian_full_name" value={editFormData.guardian_full_name} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Parentesco Apoderado:</label><input type="text" name="guardian_relationship" value={editFormData.guardian_relationship} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Celular Apoderado:</label><input type="tel" name="guardian_phone" value={editFormData.guardian_phone} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Email Apoderado:</label><input type="email" name="guardian_email" value={editFormData.guardian_email} onChange={handleEditFormChange} /></div>

                    <hr className="full-width-grid-hr" />
                    <h4 className="full-width-grid-h4">Contacto de Emergencia</h4>
                    <div className="form-group"><label>Nombre Contacto Emergencia:</label><input type="text" name="emergency_contact_name" value={editFormData.emergency_contact_name} onChange={handleEditFormChange} /></div>
                    <div className="form-group"><label>Celular Contacto Emergencia:</label><input type="tel" name="emergency_contact_phone" value={editFormData.emergency_contact_phone} onChange={handleEditFormChange} /></div>

                    <hr className="full-width-grid-hr" />
                    <h4 className="full-width-grid-h4">Información Adicional</h4>
                    <div className="form-group full-width-grid"><label>Condiciones Médicas:</label><textarea name="medical_conditions" value={editFormData.medical_conditions} onChange={handleEditFormChange} rows="2"></textarea></div>
                    <div className="form-group full-width-grid"><label>Comentarios Adicionales:</label><textarea name="comments" value={editFormData.comments} onChange={handleEditFormChange} rows="2"></textarea></div>
                  </div>
                )}

                {/* Common fields for both tabs can be placed here if any */}
                <div className="form-group full-width-grid" style={{marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem'}}>
                  <label className="inline-label">
                    <input type="checkbox" name="is_active" checked={!!editFormData.is_active} onChange={handleEditFormChange} /> Estudiante Activo
                  </label>
                </div>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', marginTop: '1.5rem' }}>
                <div>
                  <button type="button" onClick={() => handleOpenFaceRegistrationModal(currentStudent)} className="btn-action">
                    <FaceIcon /> Registrar Rostro
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" onClick={handleCloseEditModal} className="btn-secondary">Cancelar</button>
                  <button type="submit" className="btn-primary" disabled={isSubmitting}>
                    {isSubmitting ? <Spinner size="20px" /> : <><SaveIcon /> Guardar Cambios</>}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onConfirm={handleToggleStudentStatus}
        title={`Confirmar cambio de estado`}
        message={`¿Está seguro que desea ${studentToToggleStatus?.is_active ? 'inhabilitar' : 'habilitar'} a ${studentToToggleStatus?.full_name}?`}
        confirmText={`${studentToToggleStatus?.is_active ? 'Inhabilitar' : 'Habilitar'}`}
        confirmButtonClassName={`${studentToToggleStatus?.is_active ? 'btn-danger' : ''}`}
        showSpinner={isTogglingStatus}
      />

      {showFaceRegistrationModal && studentForFaceRegistration && (
        <FaceRegistration
          studentId={studentForFaceRegistration.id}
          userType="teacher"
          isOpen={showFaceRegistrationModal}
          onClose={handleCloseFaceRegistrationModal}
        />
      )}
    </div>
  );
};

export default StudentManagementPage;
