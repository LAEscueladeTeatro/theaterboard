import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Función para obtener la hora actual en Perú (Lima, UTC-5)
const getCurrentPeruDateTimeObject = () => {
  const now = new Date();
  const options = {
    timeZone: 'America/Lima',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(now);
  const dateParts = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      dateParts[part.type] = parseInt(part.value, 10);
    }
  }
  return new Date(dateParts.year, dateParts.month - 1, dateParts.day, dateParts.hour, dateParts.minute, dateParts.second);
};

const STATUS_DISPLAY_MAP = {
  PUNTUAL: { text: 'Puntual', basePoints: 2 },
  A_TIEMPO: { text: 'A Tiempo', basePoints: 1 },
  TARDANZA_JUSTIFICADA: { text: 'Tardanza Justificada', basePoints: -1 },
  TARDANZA_INJUSTIFICADA: { text: 'Tardanza Injustificada', basePoints: -2 },
  AUSENCIA_JUSTIFICADA: { text: 'Ausencia Justificada', basePoints: -1 },
  AUSENCIA_INJUSTIFICADA: { text: 'Ausencia Injustificada', basePoints: -3 },
  NO_REGISTRADO: { text: 'No Registrado', basePoints: 0 },
};

const getDisplayableAttendanceInfo = (status, points_earned = 0, base_attendance_points = 0) => {
  const displayInfo = STATUS_DISPLAY_MAP[status] || { text: status, basePoints: 0 };
  let totalPoints = 0;
  if (status && !status.startsWith('AUSENCIA') && status !== 'NO_REGISTRADO') {
    totalPoints = (points_earned || 0) + (base_attendance_points || 0);
  } else if (status) {
    totalPoints = (points_earned || 0);
  }
  return `${displayInfo.text} (${totalPoints >= 0 ? '+' : ''}${totalPoints} pts)`;
};

// 1. Aceptar prop selectedDate (renombrada a historicDateProp para claridad interna)
const TeacherAttendancePage = ({ selectedDate: historicDateProp }) => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPeruDateTime, setCurrentPeruDateTime] = useState(getCurrentPeruDateTimeObject());
  const [attendanceData, setAttendanceData] = useState({});
  const [dailyStatus, setDailyStatus] = useState({ attendance_records: [], bonus_awarded_today: null });

  const [tardanzaModalOpen, setTardanzaModalOpen] = useState(false);
  const [tardanzaStudent, setTardanzaStudent] = useState(null);
  const [tardanzaJustification, setTardanzaJustification] = useState('');
  const [tardanzaNotes, setTardanzaNotes] = useState('');

  const [selectedStudentForBonus, setSelectedStudentForBonus] = useState('');

  const [closeAttendanceModalOpen, setCloseAttendanceModalOpen] = useState(false);
  const [absentStudentsForModal, setAbsentStudentsForModal] = useState([]);
  const [absentJustifications, setAbsentJustifications] = useState({});

  const API_URL = 'http://localhost:3001/api';

  const getTodayPeruDateString = useCallback(() => {
    const nowInPeru = getCurrentPeruDateTimeObject();
    const year = nowInPeru.getFullYear();
    const month = (nowInPeru.getMonth() + 1).toString().padStart(2, '0');
    const day = nowInPeru.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // 2. Determinar la fecha a usar: prop si existe, si no, la fecha actual de Perú.
  const [dateForOperations, setDateForOperations] = useState(historicDateProp || getTodayPeruDateString());

  useEffect(() => {
    if (historicDateProp) {
      setDateForOperations(historicDateProp);
    } else {
      setDateForOperations(getTodayPeruDateString());
    }
    // Resetear estados que dependen de la fecha cuando esta cambia
    setDailyStatus({ attendance_records: [], bonus_awarded_today: null });
    setAttendanceData({});
    setSelectedStudentForBonus('');
    // No es necesario resetear `students` o `allStudents` ya que la lista de estudiantes activos no cambia con la fecha.
  }, [historicDateProp, getTodayPeruDateString]);


  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  // Cargar estudiantes y estado de asistencia del día
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const headers = { 'x-auth-token': token };

        const studentsResponse = await axios.get(`${API_URL}/admin/students?active=true`, { headers });
        setAllStudents(studentsResponse.data);
        setStudents(studentsResponse.data);

        // Usar dateForOperations para obtener el estado de asistencia
        const dailyStatusResponse = await axios.get(`${API_URL}/attendance/status/${dateForOperations}`, { headers });
        setDailyStatus(dailyStatusResponse.data);

        const initialAttendance = {};
        dailyStatusResponse.data.attendance_records.forEach(record => {
          initialAttendance[record.student_id] = {
            status: record.status,
            notes: record.notes || '',
            is_synced: true
          };
        });
        setAttendanceData(initialAttendance);

      } catch (err) {
        console.error(`Error fetching initial data for date ${dateForOperations}:`, err);
        setError(err.response?.data?.message || err.message || 'Error al cargar datos iniciales.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken, dateForOperations]); // 3. Usar dateForOperations en dependencias

  // Actualizar hora de Perú cada segundo (solo si no es una fecha histórica)
  useEffect(() => {
    let timer;
    if (!historicDateProp) {
      timer = setInterval(() => {
        setCurrentPeruDateTime(getCurrentPeruDateTimeObject());
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [historicDateProp]);

  useEffect(() => {
    if (!searchTerm) {
      setStudents(allStudents);
      return;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = allStudents.filter(student =>
      student.full_name.toLowerCase().includes(lowerSearchTerm) ||
      student.id.toLowerCase().includes(lowerSearchTerm)
    );
    setStudents(filtered);
  }, [searchTerm, allStudents]);

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
        is_synced: false,
      }
    }));
  };

  const getPeruTimeForAttendance = () => {
    return currentPeruDateTime;
  };

  const determineStatusBasedOnTime = () => {
    // 4. Lógica de status basada en tiempo solo si NO es una fecha histórica
    if (historicDateProp) {
      // Para fechas históricas, el docente debe elegir el estado.
      // Forzamos 'TARDANZA' para que se abra el modal, donde el profesor puede seleccionar.
      // Esta es una simplificación; un mejor enfoque sería un modal más genérico o un selector directo.
      return 'TARDANZA';
    }

    const nowPeru = getPeruTimeForAttendance();
    const hours = nowPeru.getHours();
    const minutes = nowPeru.getMinutes();

    if (hours < 17) { return 'PUNTUAL'; }
    else if (hours === 17 && minutes <= 15) { return 'A_TIEMPO'; }
    else { return 'TARDANZA'; }
  };

  const handleOpenTardanzaModal = (student) => {
    setTardanzaStudent(student);
    setTardanzaNotes(attendanceData[student.id]?.notes || '');
    setTardanzaJustification('');
    setTardanzaModalOpen(true);
  };

  const handleCloseTardanzaModal = () => {
    setTardanzaModalOpen(false);
    setTardanzaStudent(null);
    setTardanzaJustification('');
    setTardanzaNotes('');
  };

  const handleSubmitTardanzaModal = () => {
    if (!tardanzaStudent || !tardanzaJustification) {
      alert("Por favor, seleccione si la tardanza es justificada o injustificada.");
      return;
    }
    const statusToSave = tardanzaJustification === 'JUSTIFICADA' ? 'TARDANZA_JUSTIFICADA' : 'TARDANZA_INJUSTIFICADA';
    saveAttendanceRecord(tardanzaStudent.id, statusToSave, tardanzaNotes);
    handleCloseTardanzaModal();
  };

  const saveAttendanceRecord = async (studentId, status, notes) => {
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/attendance/record`, {
        student_id: studentId,
        attendance_date: dateForOperations, // <-- 5. Usar dateForOperations
        status: status,
        notes: notes,
      }, { headers: { 'x-auth-token': token } });

      setAttendanceData(prev => ({
        ...prev,
        [studentId]: { status: status, notes: notes, is_synced: true }
      }));

      setDailyStatus(prev => {
        const studentInfo = allStudents.find(s => s.id === studentId);
        const updatedRecords = prev.attendance_records.filter(r => r.student_id !== studentId);
        updatedRecords.push({
            student_id: studentId, status: status, notes: notes,
            full_name: studentInfo?.full_name || 'Desconocido',
            nickname: studentInfo?.nickname || '',
            points_earned: response.data.record.points_earned,
            base_attendance_points: response.data.record.base_attendance_points,
            recorded_at: response.data.record.recorded_at,
        });
        return { ...prev, attendance_records: updatedRecords.sort((a,b) => (a.full_name || "").localeCompare(b.full_name || "")) };
      });

      const studentInfoForAlert = allStudents.find(s => s.id === studentId);
      const studentNameForAlert = studentInfoForAlert?.full_name || studentId;
      alert(`Asistencia para ${studentNameForAlert} (${dateForOperations}) registrada como ${status}.`);

    } catch (err) {
      console.error("Error saving attendance:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al guardar asistencia.';
      setError(errorMsg);
      alert(`Error al guardar: ${errorMsg}`);
    }
  };

  const handleProcessAttendanceClick = (student) => {
    const timeBasedStatus = determineStatusBasedOnTime();
    if (timeBasedStatus === 'TARDANZA') { // Esto incluye el caso de historicDateProp
      handleOpenTardanzaModal(student);
    } else {
      // Este bloque solo se ejecutará si no es historicDateProp y el tiempo es PUNTUAL o A_TIEMPO
      const currentNotes = attendanceData[student.id]?.notes || '';
      saveAttendanceRecord(student.id, timeBasedStatus, currentNotes);
    }
  };

  const handleApplyEarlyBonus = async () => {
    if (historicDateProp) { // No permitir bono en fechas históricas
        alert("El bono madrugador solo se puede aplicar en la fecha actual.");
        return;
    }
    if (!selectedStudentForBonus) {
      alert("Por favor, seleccione un estudiante para otorgar el bono.");
      return;
    }
    if (dailyStatus.bonus_awarded_today) {
      alert(`El bono madrugador ya fue otorgado a ${dailyStatus.bonus_awarded_today.bonus_student_name}.`);
      return;
    }

    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/attendance/early-bonus`, {
        student_id: selectedStudentForBonus,
        bonus_date: dateForOperations, // <-- 6. Usar dateForOperations (será la fecha actual aquí)
      }, { headers: { 'x-auth-token': token } });

      setDailyStatus(prev => ({
        ...prev,
        bonus_awarded_today: {
          student_id: response.data.bonus_record.student_id,
          bonus_student_name: allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || response.data.bonus_record.student_id,
          points_awarded: response.data.bonus_record.points_awarded,
        }
      }));
      setSelectedStudentForBonus('');
      alert(`Bono madrugador otorgado a ${allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || selectedStudentForBonus}.`);

    } catch (err) {
      console.error("Error applying early bonus:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al aplicar el bono madrugador.';
      setError(errorMsg);
      alert(`Error al aplicar bono: ${errorMsg}`);
    }
  };

  const handleOpenCloseAttendanceModal = () => {
    const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id));
    const absent = allStudents.filter(student => !recordedStudentIds.has(student.id));
    setAbsentStudentsForModal(absent);
    const initialJustifications = {};
    absent.forEach(student => {
      initialJustifications[student.id] = { is_justified: false, notes: '' };
    });
    setAbsentJustifications(initialJustifications);
    setCloseAttendanceModalOpen(true);
  };

  const handleCloseModalOfAttendance = () => {
    setCloseAttendanceModalOpen(false);
  };

  const handleAbsentJustificationChange = (studentId, field, value) => {
    setAbsentJustifications(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value, }
    }));
  };

  const handleSubmitCloseAttendance = async () => {
    const justificationsPayload = Object.entries(absentJustifications)
      .map(([student_id, data]) => ({ student_id, is_justified: data.is_justified, notes: data.notes, }));

    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/attendance/close`, {
        attendance_date: dateForOperations, // <-- 7. Usar dateForOperations
        absent_students_justifications: justificationsPayload,
      }, { headers: { 'x-auth-token': token } });

      alert(response.data.message || "Cierre de asistencia procesado.");

      const updatedDailyStatusResponse = await axios.get(`${API_URL}/attendance/status/${dateForOperations}`, { headers: { 'x-auth-token': token } });
      setDailyStatus(updatedDailyStatusResponse.data);
      const newAttendanceData = { ...attendanceData };
      updatedDailyStatusResponse.data.attendance_records.forEach(record => {
        if (!newAttendanceData[record.student_id] || record.status.startsWith("AUSENCIA")) {
             newAttendanceData[record.student_id] = {
                status: record.status, notes: record.notes || '', is_synced: true
             };
        }
      });
      setAttendanceData(newAttendanceData);
      setCloseAttendanceModalOpen(false);

    } catch (err) {
      console.error("Error closing attendance:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al procesar el cierre de asistencia.';
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  };

  if (loading) return <p>Cargando datos de asistencia para {dateForOperations}...</p>;
  if (error) return <div><p>Error: {error}</p><Link to="/docente/dashboard">Volver al Panel</Link></div>;

  const renderTardanzaModal = () => {
    if (!tardanzaModalOpen || !tardanzaStudent) return null;
    // 8. Adaptar título del modal de tardanza si es histórico
    const modalTitle = historicDateProp
        ? `Registrar Estado para: ${tardanzaStudent.full_name} (${tardanzaStudent.id}) - Fecha: ${dateForOperations}`
        : `Registrar Tardanza para: ${tardanzaStudent.full_name} (${tardanzaStudent.id})`;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>{modalTitle}</h3>
          <div>
            <label>
              <input type="radio" name="justification" value="JUSTIFICADA" checked={tardanzaJustification === 'JUSTIFICADA'} onChange={(e) => setTardanzaJustification(e.target.value)} /> Justificada
            </label>
            <label style={{ marginLeft: '10px' }}>
              <input type="radio" name="justification" value="INJUSTIFICADA" checked={tardanzaJustification === 'INJUSTIFICADA'} onChange={(e) => setTardanzaJustification(e.target.value)} /> Injustificada
            </label>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="tardanzaNotes">Notas:</label>
            <textarea id="tardanzaNotes" value={tardanzaNotes} onChange={(e) => setTardanzaNotes(e.target.value)} rows="3" style={{ width: '90%', marginTop: '5px' }} />
          </div>
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleSubmitTardanzaModal}>Guardar</button>
            <button onClick={handleCloseTardanzaModal} style={{ marginLeft: '10px' }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  const isAllStudentsRecorded = () => {
    if (!allStudents || allStudents.length === 0) return false;
    const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id));
    return allStudents.every(student => recordedStudentIds.has(student.id));
  };

  const isAttendanceEffectivelyClosed = isAllStudentsRecorded();

  const renderCloseAttendanceModal = () => {
    if (!closeAttendanceModalOpen) return null;
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Cerrar Asistencia del Día: {dateForOperations}</h3>
          <p>Los siguientes estudiantes no tienen un registro de asistencia. Por favor, marque sus ausencias:</p>
          {absentStudentsForModal.length === 0 ? (<p>Todos los estudiantes ya tienen un registro.</p>) : (
            <table>
              <thead><tr><th>Estudiante</th><th>Justificada</th><th>Notas</th></tr></thead>
              <tbody>
                {absentStudentsForModal.map(student => (
                  <tr key={student.id}>
                    <td>{student.full_name} ({student.id})</td>
                    <td><input type="checkbox" checked={absentJustifications[student.id]?.is_justified || false} onChange={(e) => handleAbsentJustificationChange(student.id, 'is_justified', e.target.checked)} /></td>
                    <td><input type="text" value={absentJustifications[student.id]?.notes || ''} onChange={(e) => handleAbsentJustificationChange(student.id, 'notes', e.target.value)} placeholder="Motivo (opcional)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleSubmitCloseAttendance} disabled={absentStudentsForModal.length === 0}>Confirmar Cierre y Registrar Ausencias</button>
            <button onClick={handleCloseModalOfAttendance} style={{ marginLeft: '10px' }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {/* 9. Ocultar/mostrar elementos UI específicos si es histórico */}
      {!historicDateProp && (
        <>
          <h2>Registrar Asistencia</h2>
          <p>Fecha y Hora (Perú): {currentPeruDateTime.toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'medium' })}</p>
          <Link to="/docente/dashboard">Volver al Panel</Link>
        </>
      )}
      <p style={{ fontWeight: 'bold', color: historicDateProp ? 'blue' : 'inherit' }}>
        Fecha para registros: {dateForOperations}
      </p>

      <div>
        <input type="text" placeholder="Buscar estudiante por ID o nombre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div style={{ margin: '20px 0' }}>
        <h4>Bono Madrugador</h4>
        {dailyStatus.bonus_awarded_today ? (
          <p style={{ color: 'green' }}>
            Bono Madrugador ya otorgado a: {dailyStatus.bonus_awarded_today.bonus_student_name} ({dailyStatus.bonus_awarded_today.student_id}) por +{dailyStatus.bonus_awarded_today.points_awarded} puntos.
          </p>
        ) : (
          <div>
            <select
              value={selectedStudentForBonus}
              onChange={(e) => setSelectedStudentForBonus(e.target.value)}
              disabled={!!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed || historicDateProp} // <-- 10. Deshabilitar bono para fechas históricas
            >
              <option value="">Seleccione un estudiante</option>
              {allStudents
                .filter(student => {
                  const attendanceRecord = dailyStatus.attendance_records.find(r => r.student_id === student.id);
                  return attendanceRecord && !attendanceRecord.status.startsWith('AUSENCIA');
                })
                .map(student => (<option key={student.id} value={student.id}>{student.full_name} ({student.id})</option>))}
            </select>
            <button onClick={handleApplyEarlyBonus} disabled={!selectedStudentForBonus || !!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed || historicDateProp} style={{ marginLeft: '10px' }}>
              Otorgar Bono Madrugador
            </button>
          </div>
        )}
        {historicDateProp && <p style={{color: 'orange', marginTop: '5px'}}>El bono madrugador solo se puede otorgar el día actual.</p>}
      </div>

      <table>
        <thead><tr><th>ID</th><th>Nombre Completo</th><th>Apodo</th><th>Estado Actual</th><th>Acciones</th><th>Notas</th></tr></thead>
        <tbody>
          {students.map(student => {
            const currentStudentAttendance = attendanceData[student.id] || { status: 'NO_REGISTRADO', notes: '', is_synced: true };
            const isRecorded = dailyStatus.attendance_records.some(r => r.student_id === student.id);
            return (
              <tr key={student.id}>
                <td>{student.id}</td><td>{student.full_name}</td><td>{student.nickname}</td>
                <td>
                  {(() => {
                    const record = dailyStatus.attendance_records.find(r => r.student_id === student.id);
                    if (record) return getDisplayableAttendanceInfo(record.status, record.points_earned, record.base_attendance_points);
                    if (currentStudentAttendance.status !== 'NO_REGISTRADO' && !currentStudentAttendance.is_synced) {
                       const statusText = STATUS_DISPLAY_MAP[currentStudentAttendance.status]?.text || currentStudentAttendance.status;
                       return `${statusText} (Pendiente de guardar)`;
                    }
                    return <span style={{ color: 'grey' }}>No Registrado</span>;
                  })()}
                </td>
                <td>
                  {isRecorded && currentStudentAttendance.status.startsWith('AUSENCIA') ? (<span style={{ color: 'red' }}>Ausente (Cierre Realizado)</span>) : (
                    <button
                        onClick={() => handleProcessAttendanceClick(student)}
                        disabled={tardanzaModalOpen || isAttendanceEffectivelyClosed}
                    >
                      {/* 11. Adaptar texto del botón de acción principal */}
                      {isRecorded ? 'Corregir Asistencia' : (historicDateProp ? 'Registrar Estado' : 'Marcar Asistencia')}
                    </button>
                  )}
                </td>
                <td>
                  <input type="text" value={currentStudentAttendance.notes} onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)} placeholder="Notas..." disabled={(isRecorded && currentStudentAttendance.status.startsWith('AUSENCIA')) || isAttendanceEffectivelyClosed} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 12. Adaptar texto del botón de cierre de asistencia */}
      <button onClick={handleOpenCloseAttendanceModal} disabled={isAttendanceEffectivelyClosed} style={{marginTop: '20px'}}>
        {isAttendanceEffectivelyClosed ? `Asistencia del ${dateForOperations} Cerrada` : `Realizar Cierre de Asistencia (${dateForOperations})`}
      </button>

      {renderTardanzaModal()}
      {renderCloseAttendanceModal()}
    </div>
  );
};

export default TeacherAttendancePage;
