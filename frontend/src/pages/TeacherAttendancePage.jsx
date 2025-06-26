import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

// Simulación de la hora de Perú (Lima) - en una app real, usar una librería como moment-timezone o date-fns-tz
const getCurrentPeruTime = () => {
  const now = new Date();
  // Ajustar a UTC-5 (Lima). Esto es una simplificación.
  // new Date().toLocaleString("en-US", {timeZone: "America/Lima"}) es mejor si el navegador lo soporta bien.
  // O manejarlo puramente en el backend si la precisión es crítica.
  // Por ahora, para la UI, una estimación es suficiente.
  // Esta es una forma muy básica y puede no ser precisa con DST si Perú lo tuviera.
  // Para una solución robusta, se recomienda una librería de manejo de fechas/zonas horarias.
  const peruOffset = -5 * 60; // UTC-5 en minutos
  const localOffset = now.getTimezoneOffset(); // en minutos
  const peruTime = new Date(now.getTime() + (peruOffset - localOffset) * 60000);
  return peruTime;
};

const TeacherAttendancePage = () => {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Para mantener la lista original sin filtrar
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPeruDateTime, setCurrentPeruDateTime] = useState(getCurrentPeruTime());
  const [attendanceData, setAttendanceData] = useState({}); // { student_id: { status: 'PUNTUAL', notes: '' } }
  const [dailyStatus, setDailyStatus] = useState({ attendance_records: [], bonus_awarded_today: null });

  const API_URL = 'http://localhost:3001/api';
  const todayDateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

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
      setCurrentPeruDateTime(getCurrentPeruTime());
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

  const determineStatusBasedOnTime = (studentId) => {
    const nowPeru = getPeruTimeForAttendance();
    const hours = nowPeru.getHours();
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

  const handleMarkAttendance = async (studentId, explicitStatus = null) => {
    let statusToSave;
    let notesToSave = attendanceData[studentId]?.notes || '';

    if (explicitStatus) { // Ej: TARDANZA_JUSTIFICADA, TARDANZA_INJUSTIFICADA desde un modal
        statusToSave = explicitStatus;
    } else {
        const timeBasedStatus = determineStatusBasedOnTime(studentId);
        if (timeBasedStatus === 'TARDANZA') {
            // Aquí se abriría un modal para preguntar si es Justificada o Injustificada
            // y para recoger las notas. Por ahora, lo marcaremos como TARDANZA_INJUSTIFICADA por defecto.
            // Esta lógica se refinará.
            console.log(`Estudiante ${studentId} llegó tarde. Implementar modal para justificación.`);
            // Simulación: Preguntar al usuario (esto debería ser un modal)
            const isJustified = window.confirm("El estudiante llegó tarde. ¿Es una tardanza justificada?");
            if (isJustified) {
                statusToSave = 'TARDANZA_JUSTIFICADA';
                const reason = window.prompt("Motivo de la tardanza justificada:", notesToSave);
                notesToSave = reason || '';
            } else {
                statusToSave = 'TARDANZA_INJUSTIFICADA';
                 const reason = window.prompt("Notas para tardanza injustificada (opcional):", notesToSave);
                notesToSave = reason || '';
            }
        } else {
            statusToSave = timeBasedStatus;
        }
    }

    if (!statusToSave) return; // Si no se pudo determinar el estado

    try {
      const token = getToken();
      const response = await axios.post(`${API_URL}/attendance/record`, {
        student_id: studentId,
        attendance_date: todayDateString,
        status: statusToSave,
        notes: notesToSave,
      }, { headers: { 'x-auth-token': token } });

      // Actualizar estado local
      setAttendanceData(prev => ({
        ...prev,
        [studentId]: { status: statusToSave, notes: notesToSave, is_synced: true }
      }));
      // Actualizar dailyStatus si es necesario (para reflejar el cambio inmediatamente)
      setDailyStatus(prev => {
        const updatedRecords = prev.attendance_records.filter(r => r.student_id !== studentId);
        updatedRecords.push({
            student_id: studentId,
            status: statusToSave,
            notes: notesToSave,
            // ... otros campos del record devuelto por el backend
            full_name: students.find(s => s.id === studentId)?.full_name || '',
            nickname: students.find(s => s.id === studentId)?.nickname || '',
            points_earned: response.data.record.points_earned,
            base_attendance_points: response.data.record.base_attendance_points,
            recorded_at: response.data.record.recorded_at,
        });
        return { ...prev, attendance_records: updatedRecords };
      });

      alert(`Asistencia para ${studentId} registrada como ${statusToSave}.`);

    } catch (err) {
      console.error("Error saving attendance:", err);
      setError(err.response?.data?.message || err.message || 'Error al guardar asistencia.');
      // Revertir el cambio optimista si falla
       handleAttendanceChange(studentId, 'is_synced', true); // O volver al estado anterior si se guardó
    }
  };

  // TODO: Implementar handleApplyEarlyBonus
  // TODO: Implementar handleCloseAttendance

  if (loading) return <p>Cargando datos de asistencia...</p>;
  if (error) return <div><p>Error: {error}</p><Link to="/docente/dashboard">Volver al Panel</Link></div>;

  const isAttendanceClosedForToday = false; // Lógica para determinar si la asistencia ya se cerró

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

      {dailyStatus.bonus_awarded_today && (
        <p style={{color: 'green'}}>
          Bono Madrugador ya otorgado a: {dailyStatus.bonus_awarded_today.bonus_student_name} ({dailyStatus.bonus_awarded_today.student_id})
        </p>
      )}
      {/* TODO: Botón para Bono Madrugador si aún no se ha otorgado */}


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
                  {currentStudentAttendance.status}
                  {!currentStudentAttendance.is_synced && <em style={{color: 'orange'}}>(Pendiente)</em>}
                </td>
                <td>
                  {isRecorded && currentStudentAttendance.status.startsWith('AUSENCIA') ? (
                    <span>Ausente (Cerrado)</span>
                  ) : isRecorded ? (
                    <button onClick={() => handleMarkAttendance(student.id)}>Re-Marcar/Corregir</button>
                  ) : (
                    <>
                      <button onClick={() => handleMarkAttendance(student.id, 'PUNTUAL')}>Puntual</button>
                      <button onClick={() => handleMarkAttendance(student.id, 'A_TIEMPO')}>A Tiempo</button>
                      <button onClick={() => handleMarkAttendance(student.id /* Dejar que determine TARDANZA y abra modal */)}>Tardanza</button>
                    </>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    value={currentStudentAttendance.notes}
                    onChange={(e) => handleAttendanceChange(student.id, 'notes', e.target.value)}
                    placeholder="Notas..."
                    disabled={isRecorded && currentStudentAttendance.status.startsWith('AUSENCIA')}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* TODO: Botón para Cierre de Asistencia */}
      <button disabled={isAttendanceClosedForToday}>
        {isAttendanceClosedForToday ? 'Asistencia Cerrada' : 'Realizar Cierre de Asistencia'}
      </button>
    </div>
  );
};

export default TeacherAttendancePage;
