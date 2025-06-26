import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Función para obtener la hora actual en Perú (Lima, UTC-5)
const getCurrentPeruDateTimeObject = () => {
  // Usamos el objeto Intl.DateTimeFormat para obtener las partes de la fecha y hora en la zona horaria de Perú.
  // Esto es más robusto que los cálculos manuales de offset.
  const now = new Date();
  const options = {
    timeZone: 'America/Lima',
    year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric',
    hour12: false // Usar formato de 24 horas para facilitar la lógica
  };
  const formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' da YYYY-MM-DD, HH:MM:SS
  const parts = formatter.formatToParts(now);

  const dateParts = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      dateParts[part.type] = parseInt(part.value, 10);
    }
  }
  // Crear un nuevo objeto Date a partir de las partes. OJO: Esto lo crea en la zona horaria local del navegador
  // pero los valores numéricos corresponden a Perú. La lógica de comparación horaria deberá usar estos valores numéricos.
  // O, mejor aún, la función puede devolver directamente los componentes numéricos.
  return new Date(dateParts.year, dateParts.month - 1, dateParts.day, dateParts.hour, dateParts.minute, dateParts.second);
};


const TeacherAttendancePage = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Para mantener la lista original sin filtrar
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPeruDateTime, setCurrentPeruDateTime] = useState(getCurrentPeruDateTimeObject());
  const [attendanceData, setAttendanceData] = useState({}); // { student_id: { status: 'PUNTUAL', notes: '' } }
  const [dailyStatus, setDailyStatus] = useState({ attendance_records: [], bonus_awarded_today: null });

  // Estado para el modal de tardanza
  const [tardanzaModalOpen, setTardanzaModalOpen] = useState(false);
  const [tardanzaStudent, setTardanzaStudent] = useState(null); // { id, name }
  const [tardanzaJustification, setTardanzaJustification] = useState(''); // 'JUSTIFICADA' o 'INJUSTIFICADA'
  const [tardanzaNotes, setTardanzaNotes] = useState('');

  // Estado para el bono madrugador
  const [selectedStudentForBonus, setSelectedStudentForBonus] = useState('');

  // Estados para el modal de Cierre de Asistencia
  const [closeAttendanceModalOpen, setCloseAttendanceModalOpen] = useState(false);
  const [absentStudentsForModal, setAbsentStudentsForModal] = useState([]); // [{id, full_name, nickname}]
  const [absentJustifications, setAbsentJustifications] = useState({}); // { student_id: { is_justified: false, notes: '' } }


  const API_URL = 'http://localhost:3001/api';
  // Obtener la fecha de hoy en formato YYYY-MM-DD para la zona horaria de Perú
  const getTodayPeruDateString = () => {
    const nowInPeru = getCurrentPeruDateTimeObject(); // Esta función ya devuelve un objeto Date con valores de Perú
    const year = nowInPeru.getFullYear();
    const month = (nowInPeru.getMonth() + 1).toString().padStart(2, '0');
    const day = nowInPeru.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [todayDateString, setTodayDateString] = useState(getTodayPeruDateString());


  // Obtener token
  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  // Cargar estudiantes y estado de asistencia del día
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const headers = { 'x-auth-token': token };

        // 1. Obtener lista de todos los estudiantes
        const studentsResponse = await axios.get(`${API_URL}/students`, { headers });
        setAllStudents(studentsResponse.data);
        setStudents(studentsResponse.data); // Inicialmente mostrar todos

        // 2. Obtener estado de asistencia del día
        const dailyStatusResponse = await axios.get(`${API_URL}/attendance/status/${todayDateString}`, { headers });
        setDailyStatus(dailyStatusResponse.data);

        // Pre-rellenar attendanceData con los registros existentes
        const initialAttendance = {};
        dailyStatusResponse.data.attendance_records.forEach(record => {
          initialAttendance[record.student_id] = {
            status: record.status,
            notes: record.notes || '',
            is_synced: true // Marcar como ya guardado
          };
        });
        setAttendanceData(initialAttendance);

      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError(err.response?.data?.message || err.message || 'Error al cargar datos iniciales.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getToken, todayDateString]);

  // Actualizar hora de Perú cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPeruDateTime(getCurrentPeruDateTimeObject());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtrar estudiantes
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
        is_synced: false, // Marcar como no guardado al cambiar
      }
    }));
  };

  const getPeruTimeForAttendance = () => {
    // Esta función determinaría la hora actual al momento de marcar la asistencia
    // Para la lógica PUNTUAL, A_TIEMPO, TARDANZA
    // Por ahora, usaremos la hora actual del estado `currentPeruDateTime`
    // En una implementación más compleja, se podría tomar un snapshot al momento del click.
    return currentPeruDateTime;
  };

  const determineStatusBasedOnTime = () => { // Ya no necesita studentId aquí
    const nowPeru = getPeruTimeForAttendance();
    // Asegurarse que getHours() y getMinutes() se aplican al objeto Date correcto
    // currentPeruDateTime ya es el objeto Date con los valores de Perú
    const hours = currentPeruDateTime.getHours();
    const minutes = nowPeru.getMinutes();

    // Lógica de horas:
    // Puntual (antes de las 5:00 pm => 17:00): +2 puntos por puntualidad.
    // A Tiempo (entre 5:00 y 5:15 pm => 17:00 - 17:15): +1 punto.
    // Tardanza (después de las 5:15 pm => 17:15): Debe abrir un diálogo...

    if (hours < 17) { // Antes de las 5 PM
        return 'PUNTUAL';
    } else if (hours === 17 && minutes <= 15) { // Entre 5:00 PM y 5:15 PM
        return 'A_TIEMPO';
    } else { // Después de las 5:15 PM
        return 'TARDANZA'; // Este estado requerirá un sub-dialogo (Justificada/Injustificada)
    }
  };

  const handleOpenTardanzaModal = (student) => {
    setTardanzaStudent(student);
    setTardanzaNotes(attendanceData[student.id]?.notes || ''); // Cargar notas existentes si las hay
    setTardanzaJustification(''); // Resetear justificación
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
    // Llamar a la función principal de guardado con el estado de tardanza y las notas
    saveAttendanceRecord(tardanzaStudent.id, statusToSave, tardanzaNotes);
    handleCloseTardanzaModal();
  };

  // Función refactorizada para guardar/actualizar el registro de asistencia
  const saveAttendanceRecord = async (studentId, status, notes) => {
    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/attendance/record`, {
        student_id: studentId,
        attendance_date: todayDateString,
        status: status,
        notes: notes,
      }, { headers: { 'x-auth-token': token } });

      // Actualizar estado local
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: { status: status, notes: notes, is_synced: true }
      }));

      // Actualizar dailyStatus para reflejar el cambio inmediatamente
      setDailyStatus(prev => {
        const studentData = allStudents.find(s => s.id === studentId);
        const updatedRecords = prev.attendance_records.filter(r => r.student_id !== studentId);
        updatedRecords.push({
            student_id: studentId,
            status: status,
            notes: notes,
            full_name: studentData?.full_name || '',
            nickname: studentData?.nickname || '',
            points_earned: response.data.record.points_earned,
            base_attendance_points: response.data.record.base_attendance_points,
            recorded_at: response.data.record.recorded_at,
        });
        // Ordenar para mantener consistencia si se desea
        // updatedRecords.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
        return { ...prev, attendance_records: updatedRecords };
      });

      alert(`Asistencia para ${studentData?.full_name || studentId} registrada como ${status}.`);

    } catch (err) {
      console.error("Error saving attendance:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al guardar asistencia.';
      setError(errorMsg);
      alert(`Error al guardar: ${errorMsg}`); // Mostrar alerta al usuario
      // Considerar revertir el cambio optimista si es necesario, aunque aquí el estado se actualiza post-llamada.
      // Si `is_synced` se usara para UI optimista, aquí se resetearía.
    }
  };


  const handleProcessAttendanceClick = (student) => {
    const timeBasedStatus = determineStatusBasedOnTime();
    if (timeBasedStatus === 'TARDANZA') {
      handleOpenTardanzaModal(student);
    } else {
      // Para PUNTUAL o A_TIEMPO, se guardan directamente sin notas adicionales (a menos que ya existan)
      const currentNotes = attendanceData[student.id]?.notes || '';
      saveAttendanceRecord(student.id, timeBasedStatus, currentNotes);
    }
  };

  const handleApplyEarlyBonus = async () => {
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
        bonus_date: todayDateString,
      }, { headers: { 'x-auth-token': token } });

      // Actualizar el estado de dailyStatus para reflejar que el bono fue otorgado
      setDailyStatus(prev => ({
        ...prev,
        bonus_awarded_today: {
          student_id: response.data.bonus_record.student_id,
          bonus_student_name: allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || response.data.bonus_record.student_id,
          points_awarded: response.data.bonus_record.points_awarded,
        }
      }));
      setSelectedStudentForBonus(''); // Limpiar selección
      alert(`Bono madrugador otorgado a ${allStudents.find(s => s.id === response.data.bonus_record.student_id)?.full_name || selectedStudentForBonus}.`);

    } catch (err) {
      console.error("Error applying early bonus:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al aplicar el bono madrugador.';
      setError(errorMsg); // Podría mostrarse en un área de error general
      alert(`Error al aplicar bono: ${errorMsg}`);
    }
  };

  const handleOpenCloseAttendanceModal = () => {
    const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id));
    const absent = allStudents.filter(student => !recordedStudentIds.has(student.id));

    setAbsentStudentsForModal(absent);

    // Inicializar justificaciones para los ausentes
    const initialJustifications = {};
    absent.forEach(student => {
      initialJustifications[student.id] = { is_justified: false, notes: '' };
    });
    setAbsentJustifications(initialJustifications);
    setCloseAttendanceModalOpen(true);
  };

  const handleCloseModalOfAttendance = () => { // Renombrado para evitar conflicto
    setCloseAttendanceModalOpen(false);
    // No resetear absentStudentsForModal o absentJustifications aquí si queremos que se mantengan
    // si el modal se cierra y se vuelve a abrir sin un submit. O sí resetearlos si es preferible.
  };

  const handleAbsentJustificationChange = (studentId, field, value) => {
    setAbsentJustifications(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      }
    }));
  };

  const handleSubmitCloseAttendance = async () => {
    const justificationsPayload = Object.entries(absentJustifications)
      .map(([student_id, data]) => ({
        student_id,
        is_justified: data.is_justified,
        notes: data.notes,
      }));

    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/attendance/close`, {
        attendance_date: todayDateString,
        absent_students_justifications: justificationsPayload,
      }, { headers: { 'x-auth-token': token } });

      alert(response.data.message || "Cierre de asistencia procesado.");

      // Refrescar el estado diario para incluir los nuevos registros de ausencia
      const updatedDailyStatusResponse = await axios.get(`${API_URL}/attendance/status/${todayDateString}`, { headers: { 'x-auth-token': token } });
      setDailyStatus(updatedDailyStatusResponse.data);
       // Pre-rellenar attendanceData con los registros existentes, incluyendo las nuevas ausencias
      const newAttendanceData = { ...attendanceData }; // Mantener los registros que ya estaban
      updatedDailyStatusResponse.data.attendance_records.forEach(record => {
        if (!newAttendanceData[record.student_id] || record.status.startsWith("AUSENCIA")) { // Solo añadir/sobrescribir si es nuevo o es una ausencia
             newAttendanceData[record.student_id] = {
                status: record.status,
                notes: record.notes || '',
                is_synced: true
             };
        }
      });
      setAttendanceData(newAttendanceData);

      setCloseAttendanceModalOpen(false);
      // Aquí se podría setear un estado `isAttendanceClosedForToday = true` si el backend lo confirma.
      // Por ahora, la UI se actualizará con los nuevos datos.

    } catch (err) {
      console.error("Error closing attendance:", err);
      const errorMsg = err.response?.data?.message || err.message || 'Error al procesar el cierre de asistencia.';
      setError(errorMsg);
      alert(`Error: ${errorMsg}`);
    }
  };

  if (loading) return <p>Cargando datos de asistencia...</p>;
  if (error) return <div><p>Error: {error}</p><Link to="/docente/dashboard">Volver al Panel</Link></div>;

  // Modal para Tardanza
  const renderTardanzaModal = () => {
    if (!tardanzaModalOpen || !tardanzaStudent) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Registrar Tardanza para: {tardanzaStudent.full_name} ({tardanzaStudent.id})</h3>
          <div>
            <label>
              <input
                type="radio"
                name="justification"
                value="JUSTIFICADA"
                checked={tardanzaJustification === 'JUSTIFICADA'}
                onChange={(e) => setTardanzaJustification(e.target.value)}
              />
              Justificada
            </label>
            <label style={{ marginLeft: '10px' }}>
              <input
                type="radio"
                name="justification"
                value="INJUSTIFICADA"
                checked={tardanzaJustification === 'INJUSTIFICADA'}
                onChange={(e) => setTardanzaJustification(e.target.value)}
              />
              Injustificada
            </label>
          </div>
          <div style={{ marginTop: '10px' }}>
            <label htmlFor="tardanzaNotes">Notas:</label>
            <textarea
              id="tardanzaNotes"
              value={tardanzaNotes}
              onChange={(e) => setTardanzaNotes(e.target.value)}
              rows="3"
              style={{ width: '90%', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleSubmitTardanzaModal}>Guardar Tardanza</button>
            <button onClick={handleCloseTardanzaModal} style={{ marginLeft: '10px' }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };

  const isAllStudentsRecorded = () => {
    if (!allStudents || allStudents.length === 0) return false; // No hay estudiantes para registrar
    const recordedStudentIds = new Set(dailyStatus.attendance_records.map(r => r.student_id));
    return allStudents.every(student => recordedStudentIds.has(student.id));
  };

  // Considerar que la asistencia está "cerrada" si todos los estudiantes tienen un registro.
  // Una lógica más robusta podría venir del backend o un estado explícito.
  const isAttendanceEffectivelyClosed = isAllStudentsRecorded();


  // Modal para Cierre de Asistencia
  const renderCloseAttendanceModal = () => {
    if (!closeAttendanceModalOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <h3>Cerrar Asistencia del Día: {todayDateString}</h3>
          <p>Los siguientes estudiantes no tienen un registro de asistencia. Por favor, marque sus ausencias:</p>
          {absentStudentsForModal.length === 0 ? (
            <p>Todos los estudiantes ya tienen un registro.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Justificada</th>
                  <th>Notas</th>
                </tr>
              </thead>
              <tbody>
                {absentStudentsForModal.map(student => (
                  <tr key={student.id}>
                    <td>{student.full_name} ({student.id})</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={absentJustifications[student.id]?.is_justified || false}
                        onChange={(e) => handleAbsentJustificationChange(student.id, 'is_justified', e.target.checked)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        value={absentJustifications[student.id]?.notes || ''}
                        onChange={(e) => handleAbsentJustificationChange(student.id, 'notes', e.target.value)}
                        placeholder="Motivo (opcional)"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleSubmitCloseAttendance} disabled={absentStudentsForModal.length === 0}>
              Confirmar Cierre y Registrar Ausencias
            </button>
            <button onClick={handleCloseModalOfAttendance} style={{ marginLeft: '10px' }}>Cancelar</button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <div>
      <h2>Registrar Asistencia</h2>
      <p>Fecha y Hora (Perú): {currentPeruDateTime.toLocaleString('es-PE', { dateStyle: 'full', timeStyle: 'medium' })}</p>
      <p>Fecha para registros: {todayDateString}</p>
      <Link to="/docente/dashboard">Volver al Panel</Link>

      <div>
        <input
          type="text"
          placeholder="Buscar estudiante por ID o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
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
              disabled={!!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed}
            >
              <option value="">Seleccione un estudiante</option>
              {allStudents
                .filter(student => {
                  // Incluir solo estudiantes que tienen un registro de asistencia y no es ausencia
                  const attendanceRecord = dailyStatus.attendance_records.find(r => r.student_id === student.id);
                  return attendanceRecord && !attendanceRecord.status.startsWith('AUSENCIA');
                })
                .map(student => (
                  <option key={student.id} value={student.id}>
                    {student.full_name} ({student.id})
                  </option>
                ))}
            </select>
            <button
              onClick={handleApplyEarlyBonus}
              disabled={!selectedStudentForBonus || !!dailyStatus.bonus_awarded_today || isAttendanceEffectivelyClosed}
              style={{ marginLeft: '10px' }}
            >
              Otorgar Bono Madrugador
            </button>
          </div>
        )}
      </div>

      <table>
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

            return (
              <tr key={student.id}>
                <td>{student.id}</td>
                <td>{student.full_name}</td>
                <td>{student.nickname}</td>
                <td>
                  {currentStudentAttendance.status === 'NO_REGISTRADO' && !isRecorded ? (
                    <span style={{ color: 'grey' }}>No Registrado</span>
                  ) : (
                    <>
                      {currentStudentAttendance.status}
                      {!currentStudentAttendance.is_synced && currentStudentAttendance.status !== 'NO_REGISTRADO' && <em style={{color: 'orange'}}> (Pendiente)</em>}
                    </>
                  )}
                </td>
                <td>
                  {isRecorded && currentStudentAttendance.status.startsWith('AUSENCIA') ? (
                    <span style={{ color: 'red' }}>Ausente (Cierre Realizado)</span>
                  ) : (
                    <button
                        onClick={() => handleProcessAttendanceClick(student)}
                        disabled={tardanzaModalOpen || isAttendanceEffectivelyClosed}
                    >
                      {isRecorded ? 'Corregir Asistencia' : 'Marcar Asistencia'}
                    </button>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={currentStudentAttendance.notes}
                    onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)}
                    placeholder="Notas..."
                    disabled={(isRecorded && currentStudentAttendance.status.startsWith('AUSENCIA')) || isAttendanceEffectivelyClosed}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <button
        onClick={handleOpenCloseAttendanceModal}
        disabled={isAttendanceEffectivelyClosed} // Corrected variable name
        style={{marginTop: '20px'}}
      >
        {isAttendanceEffectivelyClosed ? 'Asistencia del Día Cerrada' : 'Realizar Cierre de Asistencia'}
      </button>

      {/* Renderizar el modal de tardanza */}
      {renderTardanzaModal()}

      {/* Renderizar el modal de cierre de asistencia */}
      {renderCloseAttendanceModal()}

      {/* Los estilos del modal se moverán a un archivo CSS global o se definirán de otra manera si es necesario */}
    </div>
  );
};

export default TeacherAttendancePage;
