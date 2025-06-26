import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Iconos
const GiftIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path d="M10 1.5a1.5 1.5 0 00-1.5 1.5v1.233A5.003 5.003 0 005.78 7.52L3.666 9.634a.75.75 0 000 1.06L9.25 16.28a.75.75 0 001.06 0L16.333 10.7a.75.75 0 000-1.061L14.221 7.52c-.902-.903-2.148-1.498-3.471-1.724V3a1.5 1.5 0 00-1.5-1.5c-.396 0-.772.156-1.06.439A1.5 1.5 0 0010 1.5zm0 3.417a3.5 3.5 0 013.231 2.066l.06.112L15.03 8.833l-5.03 5.03-1.739-1.739.011-.01.68-.68a3.502 3.502 0 012.048-5.006V4.917zM10 18a.75.75 0 000-1.5.75.75 0 000 1.5z" /></svg>;
const CheckCircleIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;

const getCurrentPeruDateTimeObject = () => { const now = new Date(); const options = { timeZone: 'America/Lima', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: false }; const formatter = new Intl.DateTimeFormat('en-CA', options); const parts = formatter.formatToParts(now); const dateParts = {}; for (const part of parts) { if (part.type !== 'literal') { dateParts[part.type] = parseInt(part.value, 10); } } return new Date(dateParts.year, dateParts.month - 1, dateParts.day, dateParts.hour, dateParts.minute, dateParts.second);};
const STATUS_DISPLAY_MAP = { PUNTUAL: { text: 'Puntual', basePoints: 2 }, A_TIEMPO: { text: 'A Tiempo', basePoints: 1 }, TARDANZA_JUSTIFICADA: { text: 'Tardanza Justificada', basePoints: -1 }, TARDANZA_INJUSTIFICADA: { text: 'Tardanza Injustificada', basePoints: -2 }, AUSENCIA_JUSTIFICADA: { text: 'Ausencia Justificada', basePoints: -1 }, AUSENCIA_INJUSTIFICADA: { text: 'Ausencia Injustificada', basePoints: -3 }, NO_REGISTRADO: { text: 'No Registrado', basePoints: 0 }};
const HISTORIC_STATUS_OPTIONS = [ { value: 'PUNTUAL', label: 'Puntual' }, { value: 'A_TIEMPO', label: 'A Tiempo' }, { value: 'TARDANZA_JUSTIFICADA', label: 'Tardanza Justificada' }, { value: 'TARDANZA_INJUSTIFICADA', label: 'Tardanza Injustificada' }];
const getDisplayableAttendanceInfo = (status, points_earned = 0, base_attendance_points = 0) => { const displayInfo = STATUS_DISPLAY_MAP[status] || { text: status, basePoints: 0 }; let totalPoints = 0; if (status && !status.startsWith('AUSENCIA') && status !== 'NO_REGISTRADO') { totalPoints = (points_earned || 0) + (base_attendance_points || 0); } else if (status) { totalPoints = (points_earned || 0); } return `${displayInfo.text} (${totalPoints >= 0 ? '+' : ''}${totalPoints} pts)`; };

// Colores directos para diagnóstico
const COLOR_TEACHER_PURPLE = '#9D4EDD';
const COLOR_STUDENT_BLUE = '#3498DB';
// const COLOR_SECONDARY_BUTTON_BG = '#2A2A3E'; // Para botones 'Cancelar', ya se aplica con clase .btn-secondary

const TeacherAttendancePage = ({ selectedDate: historicDateProp }) => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPeruDateTime, setCurrentPeruDateTime] = useState(getCurrentPeruDateTimeObject());
  const [attendanceData, setAttendanceData] = useState({});
  const [dailyStatus, setDailyStatus] = useState({ attendance_records: [], bonus_awarded_today: null });
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusModalStudent, setStatusModalStudent] = useState(null);
  const [statusModalSelectedStatus, setStatusModalSelectedStatus] = useState('');
  const [statusModalNotes, setStatusModalNotes] = useState('');
  const [selectedStudentForBonus, setSelectedStudentForBonus] = useState('');
  const [closeAttendanceModalOpen, setCloseAttendanceModalOpen] = useState(false);
  const [absentStudentsForModal, setAbsentStudentsForModal] = useState([]);
  const [absentJustifications, setAbsentJustifications] = useState({});

  const API_URL = 'http://localhost:3001/api';
  const getTodayPeruDateString = useCallback(() => { const nowInPeru = getCurrentPeruDateTimeObject(); const year = nowInPeru.getFullYear(); const month = (nowInPeru.getMonth() + 1).toString().padStart(2, '0'); const day = nowInPeru.getDate().toString().padStart(2, '0'); return `${year}-${month}-${day}`; }, []);
  const [dateForOperations, setDateForOperations] = useState(historicDateProp || getTodayPeruDateString());

  useEffect(() => { const newDate = historicDateProp || getTodayPeruDateString(); setDateForOperations(newDate); setDailyStatus({ attendance_records: [], bonus_awarded_today: null }); setAttendanceData({}); setSelectedStudentForBonus(''); }, [historicDateProp, getTodayPeruDateString]);
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  useEffect(() => { const fetchData = async () => { setLoading(true); setError(null); try { const token = getToken(); const headers = { 'x-auth-token': token }; const studentsResponse = await axios.get(`${API_URL}/admin/students?active=true`, { headers }); setAllStudents(studentsResponse.data); setStudents(studentsResponse.data); const dailyStatusResponse = await axios.get(`${API_URL}/attendance/status/${dateForOperations}`, { headers }); setDailyStatus(dailyStatusResponse.data); const initialAttendance = {}; dailyStatusResponse.data.attendance_records.forEach(record => { initialAttendance[record.student_id] = { status: record.status, notes: record.notes || '', is_synced: true }; }); setAttendanceData(initialAttendance); } catch (err) { console.error(`Error fetching initial data for date ${dateForOperations}:`, err); setError(err.response?.data?.message || err.message || 'Error al cargar datos iniciales.'); } finally { setLoading(false); } }; fetchData(); }, [getToken, dateForOperations]);
  useEffect(() => { let timer; if (!historicDateProp) { timer = setInterval(() => setCurrentPeruDateTime(getCurrentPeruDateTimeObject()), 1000); } return () => { if (timer) clearInterval(timer); }; }, [historicDateProp]);
  useEffect(() => { if (!searchTerm) { setStudents(allStudents); return; } const lowerSearchTerm = searchTerm.toLowerCase(); const filtered = allStudents.filter(student => student.full_name.toLowerCase().includes(lowerSearchTerm) || student.id.toLowerCase().includes(lowerSearchTerm)); setStudents(filtered); }, [searchTerm, allStudents]);

  const handleAttendanceChange = (studentId, field, value) => setAttendanceData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value, is_synced: false } }));
  const determineStatusTypeForModal = () => { if (historicDateProp) return 'HISTORIC_MODAL'; const nowPeru = currentPeruDateTime; const hours = nowPeru.getHours(); const minutes = nowPeru.getMinutes(); if (hours < 17) return 'PUNTUAL_DIRECT'; if (hours === 17 && minutes <= 15) return 'A_TIEMPO_DIRECT'; return 'TARDANZA_MODAL'; };
  const handleOpenStatusModal = (student, existingStatus = '') => { setStatusModalStudent(student); setStatusModalNotes(attendanceData[student.id]?.notes || ''); let defaultStatus = ''; if (historicDateProp) { defaultStatus = existingStatus || 'PUNTUAL'; } else { defaultStatus = existingStatus || 'TARDANZA_INJUSTIFICADA'; } setStatusModalSelectedStatus(existingStatus || defaultStatus); setStatusModalOpen(true); };
  const handleCloseStatusModal = () => { setStatusModalOpen(false); setStatusModalStudent(null); setStatusModalSelectedStatus(''); setStatusModalNotes(''); };
  const handleSubmitStatusModal = () => { if (!statusModalStudent || !statusModalSelectedStatus) { alert("Por favor, seleccione un estado de asistencia."); return; } saveAttendanceRecord(statusModalStudent.id, statusModalSelectedStatus, statusModalNotes); handleCloseStatusModal(); };
  const saveAttendanceRecord = async (studentId, status, notes) => { try { const token = getToken(); const response = await axios.post(`${API_URL}/attendance/record`, { student_id: studentId, attendance_date: dateForOperations, status: status, notes: notes, }, { headers: { 'x-auth-token': token } }); setAttendanceData(prev => ({ ...prev, [studentId]: { status: status, notes: notes, is_synced: true } })); setDailyStatus(prev => { const studentInfo = allStudents.find(s => s.id === studentId); const updatedRecords = prev.attendance_records.filter(r => r.student_id !== studentId); updatedRecords.push({ student_id: studentId, status: status, notes: notes, full_name: studentInfo?.full_name || 'Desconocido', nickname: studentInfo?.nickname || '', points_earned: response.data.record.points_earned, base_attendance_points: response.data.record.base_attendance_points, recorded_at: response.data.record.recorded_at, }); return { ...prev, attendance_records: updatedRecords.sort((a,b) => (a.full_name || "").localeCompare(b.full_name || "")) }; }); const studentInfoForAlert = allStudents.find(s => s.id === studentId); alert(`Asistencia para ${studentInfoForAlert?.full_name || studentId} (${dateForOperations}) registrada como ${status}.`); } catch (err) { console.error("Error saving attendance:", err); const errorMsg = err.response?.data?.message || err.message || 'Error al guardar asistencia.'; setError(errorMsg); alert(`Error al guardar: ${errorMsg}`); }};
  const handleProcessAttendanceClick = (student) => { const isRecorded = dailyStatus.attendance_records.some(r => r.student_id === student.id); const currentRecord = dailyStatus.attendance_records.find(r => r.student_id === student.id); if (historicDateProp || isRecorded) { handleOpenStatusModal(student, currentRecord?.status); } else { const statusType = determineStatusTypeForModal(); if (statusType === 'PUNTUAL_DIRECT') { saveAttendanceRecord(student.id, 'PUNTUAL', attendanceData[student.id]?.notes || ''); } else if (statusType === 'A_TIEMPO_DIRECT') { saveAttendanceRecord(student.id, 'A_TIEMPO', attendanceData[student.id]?.notes || ''); } else { handleOpenStatusModal(student, 'TARDANZA_INJUSTIFICADA'); } } };
  const handleApplyEarlyBonus = async () => { if (historicDateProp) { alert("El bono madrugador solo se puede aplicar en la fecha actual."); return; } if (!selectedStudentForBonus) { alert("Por favor, seleccione un estudiante para otorgar el bono."); return; } if (dailyStatus.bonus_awarded_today) { alert(`El bono madrugador ya fue otorgado a ${dailyStatus.bonus_awarded_today.bonus_student_name}.`); return; } try { const token = getToken(); const response = await axios.post(`${API_URL}/attendance/early-bonus`, { student_id: selectedStudentForBonus, bonus_date: dateForOperations, }, { headers: { 'x-auth-token': token } }); setDailyStatus(prev => ({ ...prev, bonus_awarded_today: { ...response.data.bonus_record, bonus_student_name: allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || response.data.bonus_record.student_id }})); setSelectedStudentForBonus(''); alert(`Bono madrugador otorgado a ${allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || selectedStudentForBonus}.`); } catch (err) { console.error("Error applying early bonus:", err); setError(err.response?.data?.message || err.message || 'Error al aplicar el bono.'); alert(`Error al aplicar bono: ${err.response?.data?.message || err.message}`); }};
  const handleOpenCloseAttendanceModal = () => { const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id)); const absent = allStudents.filter(student => !recordedStudentIds.has(student.id)); setAbsentStudentsForModal(absent); const initialJustifications = {}; absent.forEach(student => { initialJustifications[student.id] = { is_justified: false, notes: '' }; }); setAbsentJustifications(initialJustifications); setCloseAttendanceModalOpen(true); };
  const handleCloseModalOfAttendance = () => setCloseAttendanceModalOpen(false);
  const handleAbsentJustificationChange = (studentId, field, value) => setAbsentJustifications(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  const handleSubmitCloseAttendance = async () => { const justificationsPayload = Object.entries(absentJustifications).map(([student_id, data]) => ({ student_id, is_justified: data.is_justified, notes: data.notes })); try { const token = getToken(); await axios.post(`${API_URL}/attendance/close`, { attendance_date: dateForOperations, absent_students_justifications: justificationsPayload, }, { headers: { 'x-auth-token': token } }); const updatedDailyStatusResponse = await axios.get(`${API_URL}/attendance/status/${dateForOperations}`, { headers: { 'x-auth-token': token } }); setDailyStatus(updatedDailyStatusResponse.data); const newAttendanceData = { ...attendanceData }; updatedDailyStatusResponse.data.attendance_records.forEach(record => { if (!newAttendanceData[record.student_id] || record.status.startsWith("AUSENCIA")) { newAttendanceData[record.student_id] = { status: record.status, notes: record.notes || '', is_synced: true }; } }); setAttendanceData(newAttendanceData); alert("Cierre de asistencia procesado."); setCloseAttendanceModalOpen(false); } catch (err) { console.error("Error closing attendance:", err); setError(err.response?.data?.message || err.message || 'Error al cerrar asistencia.'); alert(`Error: ${err.response?.data?.message || err.message}`); }};

  if (loading) return <div className="content-page-container"><p className="text-center" style={{padding: '2rem'}}>Cargando datos de asistencia para {dateForOperations}...</p></div>;
  if (error) return <div className="content-page-container"><div className="error-message-page">{error}</div><div style={{textAlign: 'center', marginTop: '1rem'}}><Link to="/docente/dashboard" className="btn-action btn-student" style={{backgroundColor: COLOR_STUDENT_BLUE}}>Volver al Panel</Link></div></div>;

  const isAllStudentsRecorded = () => { if (!allStudents || allStudents.length === 0) return false; const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id)); return allStudents.every(student => recordedStudentIds.has(student.id)); };
  const isAttendanceEffectivelyClosed = isAllStudentsRecorded();

  const renderStatusModal = () => {
    if (!statusModalOpen || !statusModalStudent) return null;
    const modalTitle = `Registrar/Modificar Estado para: ${statusModalStudent.full_name} (${statusModalStudent.id})`;
    const isHistoric = !!historicDateProp;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>{modalTitle}</h3>
          <p className="current-date-display" style={{fontSize: '1rem', marginBottom: '1.5rem'}}>Fecha: <strong>{dateForOperations}</strong></p>
          <div className="form-group">
            <label htmlFor="statusModalSelectedStatus">Estado de Asistencia:</label>
            <select id="statusModalSelectedStatus" value={statusModalSelectedStatus} onChange={(e) => setStatusModalSelectedStatus(e.target.value)} >
              <option value="" disabled>Seleccione un estado</option>
              {isHistoric ? ( HISTORIC_STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>) ) :
              ( <> <option value="TARDANZA_JUSTIFICADA">Tardanza Justificada</option> <option value="TARDANZA_INJUSTIFICADA">Tardanza Injustificada</option> </> )}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="statusModalNotes">Notas Adicionales:</label>
            <textarea id="statusModalNotes" value={statusModalNotes} onChange={(e) => setStatusModalNotes(e.target.value)} rows="3" placeholder="Notas (opcional)..." />
          </div>
          <div className="modal-actions">
            <button onClick={handleCloseStatusModal} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmitStatusModal} className="btn-primary" style={{backgroundColor: COLOR_TEACHER_PURPLE}}><CheckCircleIcon /> Guardar Estado</button>
          </div>
        </div>
      </div>
    );
  };

  const renderCloseAttendanceModal = () => {
    if (!closeAttendanceModalOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Cerrar Asistencia del Día: {dateForOperations}</h3>
          {absentStudentsForModal.length === 0 ? (<p style={{textAlign: 'center', margin: '1rem 0'}}>Todos los estudiantes ya tienen un registro para esta fecha.</p>) : (
            <>
              <p>Los siguientes estudiantes no tienen registro. Por favor, marque sus ausencias:</p>
              <div style={{maxHeight: '300px', overflowY: 'auto', marginTop: '1rem', marginBottom: '1rem'}}>
                <table className="styled-table modal-table">
                  <thead><tr><th>Estudiante</th><th>¿Justificada?</th><th>Notas de Ausencia</th></tr></thead>
                  <tbody>
                    {absentStudentsForModal.map(student => (
                      <tr key={student.id}>
                        <td>{student.full_name} ({student.id})</td>
                        <td>
                          <label className="inline-label">
                            <input type="checkbox" checked={absentJustifications[student.id]?.is_justified || false} onChange={(e) => handleAbsentJustificationChange(student.id, 'is_justified', e.target.checked)} /> Sí
                          </label>
                        </td>
                        <td><input type="text" value={absentJustifications[student.id]?.notes || ''} onChange={(e) => handleAbsentJustificationChange(student.id, 'notes', e.target.value)} placeholder="Motivo (opcional)" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="modal-actions">
            <button onClick={handleCloseModalOfAttendance} className="btn-secondary">Cancelar</button>
            <button onClick={handleSubmitCloseAttendance} className="btn-primary" style={{backgroundColor: COLOR_TEACHER_PURPLE}} disabled={absentStudentsForModal.length === 0}>
             <CheckCircleIcon /> Confirmar Cierre
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="content-page-container">
      {!historicDateProp && (
        <div className="page-header-controls">
           <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
        </div>
      )}
       <h2 className="page-title">{historicDateProp ? "Registro de Asistencia Histórico" : "Registrar Asistencia del Día"}</h2>
      <p className="current-date-display">
        Fecha para registros: <strong>{dateForOperations}</strong>
        {!historicDateProp && `  •  Hora Actual (Perú): ${currentPeruDateTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
      </p>

      <div className="controls-bar">
        <input
          type="text"
          placeholder="Buscar estudiante por ID o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {!historicDateProp && (
        <div className="controls-section">
          <h4 className="section-title">Bono Madrugador</h4>
          {dailyStatus.bonus_awarded_today ? (
            <p className="bonus-awarded-message">
              Bono Madrugador otorgado a: <strong>{dailyStatus.bonus_awarded_today.bonus_student_name}</strong> por +{dailyStatus.bonus_awarded_today.points_awarded} pts.
            </p>
          ) : (
            <div className="control-group">
              <label htmlFor="bonusStudentSelect">Otorgar a:</label>
              <select
                id="bonusStudentSelect"
                value={selectedStudentForBonus}
                onChange={(e) => setSelectedStudentForBonus(e.target.value)}
                disabled={!!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed || historicDateProp}
              >
                <option value="">Seleccione un estudiante</option>
                {allStudents
                  .filter(student => {
                    const attendanceRecord = dailyStatus.attendance_records.find(r => r.student_id === student.id);
                    return attendanceRecord && !attendanceRecord.status.startsWith('AUSENCIA');
                  })
                  .map(student => (<option key={student.id} value={student.id}>{student.full_name} ({student.id})</option>))}
              </select>
              <button
                onClick={handleApplyEarlyBonus}
                disabled={!selectedStudentForBonus || !!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed || historicDateProp}
                style={{backgroundColor: COLOR_TEACHER_PURPLE}}
              >
                <GiftIcon /> Otorgar Bono
              </button>
            </div>
          )}
        </div>
      )}

      {students.length > 0 ? (
        <div style={{overflowX: 'auto'}}>
          <table className="styled-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre Completo</th>
                <th>Apodo</th>
                <th>Estado Actual</th>
                <th>Acciones</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const currentStudentAttendance = attendanceData[student.id] || { status: 'NO_REGISTRADO', notes: '', is_synced: true };
                const isRecorded = dailyStatus.attendance_records.some(r => r.student_id === student.id);
                const record = dailyStatus.attendance_records.find(r => r.student_id === student.id);

                return (
                  <tr key={student.id}>
                    <td>{student.id}</td>
                    <td>{student.full_name}</td>
                    <td>{student.nickname}</td>
                    <td>
                      {record ? getDisplayableAttendanceInfo(record.status, record.points_earned, record.base_attendance_points) :
                               (currentStudentAttendance.status !== 'NO_REGISTRADO' && !currentStudentAttendance.is_synced ?
                                  `${STATUS_DISPLAY_MAP[currentStudentAttendance.status]?.text || currentStudentAttendance.status} (Pendiente)` :
                                  <span className="status-text-grey">No Registrado</span>)
                      }
                    </td>
                    <td>
                      {record?.status.startsWith('AUSENCIA') ? (
                        <span className="status-text-red">Ausente (Cierre)</span>
                      ) : (
                        <button
                            onClick={() => handleProcessAttendanceClick(student)}
                            className="btn-action-row"
                            style={{backgroundColor: COLOR_STUDENT_BLUE}}
                            disabled={statusModalOpen || isAttendanceEffectivelyClosed}
                        >
                          {isRecorded ? 'Corregir' : (historicDateProp ? 'Registrar' : 'Marcar')}
                        </button>
                      )}
                    </td>
                    <td>
                      <input
                        type="text"
                        value={currentStudentAttendance.notes}
                        onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)}
                        placeholder="Notas..."
                        disabled={(record?.status.startsWith('AUSENCIA')) || isAttendanceEffectivelyClosed}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-table-message">No hay estudiantes para mostrar con el filtro actual o no hay estudiantes activos registrados.</div>
      )}

      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={handleOpenCloseAttendanceModal}
          disabled={isAttendanceEffectivelyClosed}
          className="btn-action btn-teacher" // Esta clase debería aplicar el color morado
          style={{backgroundColor: COLOR_TEACHER_PURPLE}} // Refuerzo en línea para diagnóstico
        >
          {isAttendanceEffectivelyClosed ? `Asistencia del ${dateForOperations} Cerrada` : `Realizar Cierre de Asistencia (${dateForOperations})`}
        </button>
      </div>

      {renderStatusModal()}
      {renderCloseAttendanceModal()}
    </div>
  );
};

export default TeacherAttendancePage;
