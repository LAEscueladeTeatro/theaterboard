import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getCurrentPeruDateTimeObject, getTodayPeruDateString } from "../utils/dateUtils";
import { API_BASE_URL } from "../config";
import Spinner from '../components/Spinner';
import toast from 'react-hot-toast'; // Importar toast
import QuickScoreModal from '../components/QuickScoreModal';

// Iconos
const StarIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M10.868 2.884c.321-.662 1.215-.662 1.536 0l1.681 3.468 3.82.556c.734.107 1.03.998.494 1.512l-2.764 2.694.654 3.805c.124.73-.64 1.282-1.28.944l-3.414-1.795a1.125 1.125 0 00-1.056 0L4.77 17.76c-.64.338-1.404-.214-1.28-.944l.653-3.805-2.764-2.694c-.537-.514-.24-1.405.494-1.512l3.82-.556L9.132 2.884z" clipRule="evenodd" /></svg>;
const GiftIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path d="M10 1.5a1.5 1.5 0 00-1.5 1.5v1.233A5.003 5.003 0 005.78 7.52L3.666 9.634a.75.75 0 000 1.06L9.25 16.28a.75.75 0 001.06 0L16.333 10.7a.75.75 0 000-1.061L14.221 7.52c-.902-.903-2.148-1.498-3.471-1.724V3a1.5 1.5 0 00-1.5-1.5c-.396 0-.772.156-1.06.439A1.5 1.5 0 0010 1.5zm0 3.417a3.5 3.5 0 013.231 2.066l.06.112L15.03 8.833l-5.03 5.03-1.739-1.739.011-.01.68-.68a3.502 3.502 0 012.048-5.006V4.917zM10 18a.75.75 0 000-1.5.75.75 0 000 1.5z" /></svg>;
const CheckCircleIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>;
const CameraIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path d="M2 6a2 2 0 012-2h1.5a1.5 1.5 0 001.28-.72l.534-1.069A1.5 1.5 0 018.618 1h2.764a1.5 1.5 0 011.304.72l.534 1.07A1.5 1.5 0 0014.5 4H16a2 2 0 012 2v1H2V6z" /><path fillRule="evenodd" d="M2 8v8a2 2 0 002 2h12a2 2 0 002-2V8H2zm6.5 1.5a3.5 3.5 0 100 7 3.5 3.5 0 000-7zM10 15a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" clipRule="evenodd" /></svg>;

const STATUS_DISPLAY_MAP = { PUNTUAL: { text: 'Puntual', basePoints: 2 }, A_TIEMPO: { text: 'A Tiempo', basePoints: 1 }, TARDANZA_JUSTIFICADA: { text: 'Tardanza Justificada', basePoints: -1 }, TARDANZA_INJUSTIFICADA: { text: 'Tardanza Injustificada', basePoints: -2 }, AUSENCIA_JUSTIFICADA: { text: 'Ausencia Justificada', basePoints: -1 }, AUSENCIA_INJUSTIFICADA: { text: 'Ausencia Injustificada', basePoints: -3 }, NO_REGISTRADO: { text: 'No Registrado', basePoints: 0 }};
const HISTORIC_STATUS_OPTIONS = [ { value: 'PUNTUAL', label: 'Puntual' }, { value: 'A_TIEMPO', label: 'A Tiempo' }, { value: 'TARDANZA_JUSTIFICADA', label: 'Tardanza Justificada' }, { value: 'TARDANZA_INJUSTIFICADA', label: 'Tardanza Injustificada' }];
const getDisplayableAttendanceInfo = (status, points_earned = 0, base_attendance_points = 0) => { const displayInfo = STATUS_DISPLAY_MAP[status] || { text: status, basePoints: 0 }; let totalPoints = 0; if (status && !status.startsWith('AUSENCIA') && status !== 'NO_REGISTRADO') { totalPoints = (points_earned || 0) + (base_attendance_points || 0); } else if (status) { totalPoints = (points_earned || 0); } return `${displayInfo.text} (${totalPoints >= 0 ? '+' : ''}${totalPoints} pts)`; };

const TeacherAttendancePage = () => {
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
  const [sortConfig, setSortConfig] = useState({ key: 'full_name', direction: 'ascending' });
  const [quickScoreStudent, setQuickScoreStudent] = useState(null);

  // Estados para spinners de acciones
  const [isApplyingBonus, setIsApplyingBonus] = useState(false);
  const [isClosingAttendance, setIsClosingAttendance] = useState(false);
  const [isSavingSpecificAttendance, setIsSavingSpecificAttendance] = useState(false);

  const [dateForOperations, setDateForOperations] = useState(getTodayPeruDateString());

  useEffect(() => {
    // Reset state when date changes
    setDailyStatus({ attendance_records: [], bonus_awarded_today: null });
    setAttendanceData({});
    setSelectedStudentForBonus('');
  }, [dateForOperations]);
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  useEffect(() => { const fetchData = async () => { setLoading(true); setError(null); try { const token = getToken(); const headers = { 'x-auth-token': token }; const studentsResponse = await axios.get(`${API_BASE_URL}/admin/students?active=true`, { headers }); setAllStudents(studentsResponse.data); setStudents(studentsResponse.data); const dailyStatusResponse = await axios.get(`${API_BASE_URL}/attendance/status/${dateForOperations}?t=${new Date().getTime()}`, { headers }); setDailyStatus(dailyStatusResponse.data); const initialAttendance = {}; dailyStatusResponse.data.attendance_records.forEach(record => { initialAttendance[record.student_id] = { status: record.status, notes: record.notes || '', is_synced: true }; }); setAttendanceData(initialAttendance); } catch (err) { console.error(`Error fetching initial data for date ${dateForOperations}:`, err); setError(err.response?.data?.message || err.message || 'Error al cargar datos iniciales.'); } finally { setLoading(false); } }; fetchData(); }, [getToken, dateForOperations, API_BASE_URL]);
  useEffect(() => {
    let timer;
    if (dateForOperations === getTodayPeruDateString()) {
      timer = setInterval(() => setCurrentPeruDateTime(getCurrentPeruDateTimeObject()), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [dateForOperations]);
  const processedStudents = React.useMemo(() => {
    let sortableItems = [...allStudents]; // Start with all students for the current group

    // 1. Filter by search term first
    if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        sortableItems = sortableItems.filter(student =>
            student.full_name.toLowerCase().includes(lowerSearchTerm) ||
            student.id.toLowerCase().includes(lowerSearchTerm)
        );
    }

    // 2. Then, sort the filtered list
    const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id));

    sortableItems.sort((a, b) => {
        const aIsRecorded = recordedStudentIds.has(a.id);
        const bIsRecorded = recordedStudentIds.has(b.id);

        // Primary sort: unmarked students first
        if (aIsRecorded !== bIsRecorded) {
            return aIsRecorded ? 1 : -1;
        }

        // Secondary sort: user-selected column
        if (sortConfig !== null) {
            const valA = a[sortConfig.key] || '';
            const valB = b[sortConfig.key] || '';
            if (valA < valB) {
              return sortConfig.direction === 'ascending' ? -1 : 1;
            }
            if (valA > valB) {
              return sortConfig.direction === 'ascending' ? 1 : -1;
            }
        }
        return 0;
    });

    return sortableItems;
  }, [allStudents, searchTerm, sortConfig, dailyStatus.attendance_records]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleAttendanceChange = (studentId, field, value) => setAttendanceData(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value, is_synced: false } }));
  const determineStatusTypeForModal = () => { if (dateForOperations !== getTodayPeruDateString()) return 'HISTORIC_MODAL'; const nowPeru = currentPeruDateTime; const hours = nowPeru.getHours(); const minutes = nowPeru.getMinutes(); if (hours < 17) return 'PUNTUAL_DIRECT'; if (hours === 17 && minutes <= 15) return 'A_TIEMPO_DIRECT'; return 'TARDANZA_MODAL'; };
  const handleOpenStatusModal = (student, existingStatus = '') => { setStatusModalStudent(student); setStatusModalNotes(attendanceData[student.id]?.notes || ''); let defaultStatus = ''; if (dateForOperations !== getTodayPeruDateString()) { defaultStatus = existingStatus || 'PUNTUAL'; } else { defaultStatus = existingStatus || 'TARDANZA_INJUSTIFICADA'; } setStatusModalSelectedStatus(existingStatus || defaultStatus); setStatusModalOpen(true); };
  const handleCloseStatusModal = () => { setStatusModalOpen(false); setStatusModalStudent(null); setStatusModalSelectedStatus(''); setStatusModalNotes(''); };
  const handleSubmitStatusModal = async () => { if (!statusModalStudent || !statusModalSelectedStatus) { toast.error("Por favor, seleccione un estado de asistencia."); return; } setIsSavingSpecificAttendance(true); try { await saveAttendanceRecord(statusModalStudent.id, statusModalSelectedStatus, statusModalNotes); } catch (saveErr) { /* El error ya se maneja y toastea en saveAttendanceRecord */ } finally { setIsSavingSpecificAttendance(false); handleCloseStatusModal(); } };
  const saveAttendanceRecord = async (studentId, status, notes) => { try { const token = getToken(); const response = await axios.post(`${API_BASE_URL}/attendance/record`, { student_id: studentId, attendance_date: dateForOperations, status: status, notes: notes, }, { headers: { 'x-auth-token': token } }); setAttendanceData(prev => ({ ...prev, [studentId]: { status: status, notes: notes, is_synced: true } })); setDailyStatus(prev => { const studentInfo = allStudents.find(s => s.id === studentId); const updatedRecords = prev.attendance_records.filter(r => r.student_id !== studentId); updatedRecords.push({ student_id: studentId, status: status, notes: notes, full_name: studentInfo?.full_name || 'Desconocido', nickname: studentInfo?.nickname || '', points_earned: response.data.record.points_earned, base_attendance_points: response.data.record.base_attendance_points, recorded_at: response.data.record.recorded_at, }); return { ...prev, attendance_records: updatedRecords.sort((a,b) => (a.full_name || "").localeCompare(b.full_name || "")) }; }); const studentInfoForAlert = allStudents.find(s => s.id === studentId); toast.success(`Asistencia para ${studentInfoForAlert?.full_name || studentId} (${dateForOperations}) registrada como ${status}.`); } catch (err) { console.error("Error saving attendance:", err); const errorMsg = err.response?.data?.message || err.message || 'Error al guardar asistencia.'; setError(errorMsg); toast.error(`Error al guardar: ${errorMsg}`); throw err; /* Re-throw para que el finally del caller se ejecute */ }};
  const handleProcessAttendanceClick = (student) => { const isRecorded = dailyStatus.attendance_records.some(r => r.student_id === student.id); const currentRecord = dailyStatus.attendance_records.find(r => r.student_id === student.id); if (historicDateProp || isRecorded) { handleOpenStatusModal(student, currentRecord?.status); } else { const statusType = determineStatusTypeForModal(); if (statusType === 'PUNTUAL_DIRECT') { saveAttendanceRecord(student.id, 'PUNTUAL', attendanceData[student.id]?.notes || ''); } else if (statusType === 'A_TIEMPO_DIRECT') { saveAttendanceRecord(student.id, 'A_TIEMPO', attendanceData[student.id]?.notes || ''); } else { handleOpenStatusModal(student, 'TARDANZA_INJUSTIFICADA'); } } };
  const handleApplyEarlyBonus = async () => { if (historicDateProp) { toast.error("El bono madrugador solo se puede aplicar en la fecha actual."); return; } if (!selectedStudentForBonus) { toast.error("Por favor, seleccione un estudiante para otorgar el bono."); return; } if (dailyStatus.bonus_awarded_today) { toast.info(`El bono madrugador ya fue otorgado a ${dailyStatus.bonus_awarded_today.bonus_student_name}.`); return; } setIsApplyingBonus(true); try { const token = getToken(); const response = await axios.post(`${API_BASE_URL}/attendance/early-bonus`, { student_id: selectedStudentForBonus, bonus_date: dateForOperations, }, { headers: { 'x-auth-token': token } }); setDailyStatus(prev => ({ ...prev, bonus_awarded_today: { ...response.data.bonus_record, bonus_student_name: allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || response.data.bonus_record.student_id }})); setSelectedStudentForBonus(''); toast.success(`Bono madrugador otorgado a ${allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || selectedStudentForBonus}.`); } catch (err) { console.error("Error applying early bonus:", err); const errorMsg = err.response?.data?.message || err.message || 'Error al aplicar el bono.'; setError(errorMsg); toast.error(`Error al aplicar bono: ${errorMsg}`); } finally { setIsApplyingBonus(false); }};
  const handleOpenCloseAttendanceModal = () => { const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id)); const absent = allStudents.filter(student => !recordedStudentIds.has(student.id)); setAbsentStudentsForModal(absent); const initialJustifications = {}; absent.forEach(student => { initialJustifications[student.id] = { is_justified: false, notes: '' }; }); setAbsentJustifications(initialJustifications); setCloseAttendanceModalOpen(true); };
  const handleCloseModalOfAttendance = () => setCloseAttendanceModalOpen(false);
  const handleAbsentJustificationChange = (studentId, field, value) => setAbsentJustifications(prev => ({ ...prev, [studentId]: { ...prev[studentId], [field]: value } }));
  const handleSubmitCloseAttendance = async () => { setIsClosingAttendance(true); const justificationsPayload = Object.entries(absentJustifications).map(([student_id, data]) => ({ student_id, is_justified: data.is_justified, notes: data.notes })); try { const token = getToken(); await axios.post(`${API_BASE_URL}/attendance/close`, { attendance_date: dateForOperations, absent_students_justifications: justificationsPayload, }, { headers: { 'x-auth-token': token } }); const updatedDailyStatusResponse = await axios.get(`${API_BASE_URL}/attendance/status/${dateForOperations}`, { headers: { 'x-auth-token': token } }); setDailyStatus(updatedDailyStatusResponse.data); const newAttendanceData = { ...attendanceData }; updatedDailyStatusResponse.data.attendance_records.forEach(record => { if (!newAttendanceData[record.student_id] || record.status.startsWith("AUSENCIA")) { newAttendanceData[record.student_id] = { status: record.status, notes: record.notes || '', is_synced: true }; } }); setAttendanceData(newAttendanceData); toast.success("Cierre de asistencia procesado."); setCloseAttendanceModalOpen(false); } catch (err) { console.error("Error closing attendance:", err); const errorMsg = err.response?.data?.message || err.message || 'Error al cerrar asistencia.'; setError(errorMsg); toast.error(`Error: ${errorMsg}`); } finally { setIsClosingAttendance(false); }};

  if (loading) return <div className="content-page-container loading-container"><Spinner /></div>;
  if (error) return <div className="content-page-container"><div className="error-message-page">{error}</div><div style={{textAlign: 'center', marginTop: '1rem'}}><Link to="/docente/dashboard" className="btn-action btn-student">Volver al Panel</Link></div></div>;

  const isAllStudentsRecorded = () => { if (!allStudents || allStudents.length === 0) return false; const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id)); return allStudents.every(student => recordedStudentIds.has(student.id)); };
  const isAttendanceEffectivelyClosed = isAllStudentsRecorded();

  const renderStatusModal = () => {
    if (!statusModalOpen || !statusModalStudent) return null;
    const modalTitle = `Registrar/Modificar Estado para: ${statusModalStudent.full_name} (${statusModalStudent.id})`;
    const isHistoric = dateForOperations !== getTodayPeruDateString();
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
            <button onClick={handleCloseStatusModal} className="btn-secondary" disabled={isSavingSpecificAttendance}>Cancelar</button>
            <button onClick={handleSubmitStatusModal} className="btn-primary" disabled={isSavingSpecificAttendance}>
              {isSavingSpecificAttendance ? <><Spinner size="16px" color="white"/> Guardando...</> : <><CheckCircleIcon /> Guardar Estado</>}
            </button>
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
                            <input type="checkbox" checked={absentJustifications[student.id]?.is_justified || false} onChange={(e) => handleAbsentJustificationChange(student.id, 'is_justified', e.target.checked)} disabled={isClosingAttendance} /> Sí
                          </label>
                        </td>
                        <td><input type="text" value={absentJustifications[student.id]?.notes || ''} onChange={(e) => handleAbsentJustificationChange(student.id, 'notes', e.target.value)} placeholder="Motivo (opcional)" disabled={isClosingAttendance} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          <div className="modal-actions">
            <button onClick={handleCloseModalOfAttendance} className="btn-secondary" disabled={isClosingAttendance}>Cancelar</button>
            <button onClick={handleSubmitCloseAttendance} className="btn-primary" disabled={absentStudentsForModal.length === 0 || isClosingAttendance}>
              {isClosingAttendance ? <><Spinner size="20px" color="white"/> Confirmando...</> : <><CheckCircleIcon /> Confirmar Cierre</>}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
         <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Registro de Asistencia</h2>

      <div className="controls-section" style={{ borderBottom: '1px solid #ccc', paddingBottom: '1rem', marginBottom: '1rem' }}>
          <div className="control-group">
              <label htmlFor="attendanceDate">Seleccionar Fecha:</label>
              <input
                  type="date"
                  id="attendanceDate"
                  value={dateForOperations}
                  onChange={(e) => setDateForOperations(e.target.value)}
              />
          </div>
      </div>

      {dateForOperations === getTodayPeruDateString() && (
        <div style={{ textAlign: 'center', margin: '1rem 0' }}>
            <Link to="/docente/asistencia-camara" className="btn-action btn-teacher" style={{fontSize: '1.1rem', padding: '12px 20px'}}>
                <CameraIcon /> Marcar Asistencia con Cámara
            </Link>
        </div>
      )}

      <p className="current-date-display">
        {dateForOperations === getTodayPeruDateString()
          ? `Registrando para Hoy: ${dateForOperations}  •  Hora Actual (Perú): ${currentPeruDateTime.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          : `Mostrando registros para: ${dateForOperations}`
        }
      </p>

      <div className="controls-bar">
        <input
          type="text"
          placeholder="Buscar estudiante por ID o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {dateForOperations === getTodayPeruDateString() && (
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
                disabled={!selectedStudentForBonus || !!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed || historicDateProp || isApplyingBonus}
                className="btn-action btn-teacher"
              >
                {isApplyingBonus ? <><Spinner size="16px" color="white" /> Aplicando...</> : <><GiftIcon /> Otorgar Bono</>}
              </button>
            </div>
          )}
        </div>
      )}

      {processedStudents.length > 0 ? (
        <div style={{overflowX: 'auto'}}>
          <table className="styled-table">
            <thead>
              <tr>
                <th><button type="button" onClick={() => requestSort('id')} className="sortable-header">ID{sortConfig.key === 'id' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}</button></th>
                <th><button type="button" onClick={() => requestSort('full_name')} className="sortable-header">Nombre Completo{sortConfig.key === 'full_name' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}</button></th>
                <th><button type="button" onClick={() => requestSort('nickname')} className="sortable-header">Apodo{sortConfig.key === 'nickname' ? (sortConfig.direction === 'ascending' ? ' ▲' : ' ▼') : ''}</button></th>
                <th>Estado Actual</th>
                <th>Acciones</th>
                <th>Puntuación Rápida</th>
                <th>Notas</th>
              </tr>
            </thead>
            <tbody>
              {processedStudents.map(student => {
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
                            disabled={statusModalOpen || isAttendanceEffectivelyClosed || isSavingSpecificAttendance}
                        >
                          {isRecorded ? 'Corregir' : (historicDateProp ? 'Registrar' : 'Marcar')}
                        </button>
                      )}
                    </td>
                    <td>
                      <button
                        className="btn-action-row"
                        onClick={() => setQuickScoreStudent(student)}
                        disabled={!isRecorded || record?.status.startsWith('AUSENCIA')}
                        title={!isRecorded || record?.status.startsWith('AUSENCIA') ? 'Debe registrar asistencia primero' : 'Añadir puntuación'}
                      >
                        <StarIcon /> Puntuar
                      </button>
                    </td>
                    <td>
                      <input
                        type="text"
                        value={currentStudentAttendance.notes}
                        onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)}
                        placeholder="Notas..."
                        disabled={(record?.status.startsWith('AUSENCIA')) || isAttendanceEffectivelyClosed || isSavingSpecificAttendance}
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
          disabled={isAttendanceEffectivelyClosed || isClosingAttendance}
          className="btn-action btn-teacher"
        >
          {isClosingAttendance ? <><Spinner size="20px" color="white"/> Cerrando...</> : (isAttendanceEffectivelyClosed ? `Asistencia del ${dateForOperations} Cerrada` : `Realizar Cierre de Asistencia (${dateForOperations})`)}
        </button>
      </div>

      {renderStatusModal()}
      {renderCloseAttendanceModal()}
      {quickScoreStudent && (
        <QuickScoreModal
          student={quickScoreStudent}
          date={dateForOperations}
          onClose={() => setQuickScoreStudent(null)}
          onScoreSaved={() => {
            // Optionally, you could refresh some data here, but for now, just closing is fine.
          }}
        />
      )}
    </div>
  );
};

export default TeacherAttendancePage;
