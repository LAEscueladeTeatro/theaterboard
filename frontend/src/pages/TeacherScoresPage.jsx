import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { getTodayPeruDateString as getTodayPeruDateStringForScores } from "../utils/dateUtils"; // Corregir ruta
import { API_BASE_URL } from "../config"; // Corregir ruta

// Iconos
const SaveIcon = () => <svg className="icon" viewBox="0 0 20 20" fill="currentColor" width="16" height="16" style={{verticalAlign: 'middle', marginRight: '0.5em'}}><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v2.5h-2.5a.75.75 0 000 1.5h2.5v2.5a.75.75 0 001.5 0v-2.5h2.5a.75.75 0 000-1.5h-2.5v-2.5z" clipRule="evenodd" /></svg>;

const TeacherScoresPage = () => {
  const [allStudents, setAllStudents] = useState([]);
  const [presentStudents, setPresentStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [error, setError] = useState('');

  const todayDateString = getTodayPeruDateStringForScores(); // Usar la función importada

  const [groupScoreType, setGroupScoreType] = useState('ROPA_TRABAJO');
  const [groupScoreDate, setGroupScoreDate] = useState(todayDateString);
  const [groupStudentStatus, setGroupStudentStatus] = useState({});

  const [personalSelectedStudent, setPersonalSelectedStudent] = useState('');
  const [personalScoreType, setPersonalScoreType] = useState('PARTICIPACION');
  const [personalPoints, setPersonalPoints] = useState('');
  const [personalSubCategory, setPersonalSubCategory] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');

  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  const fetchAttendanceAndFilterStudents = useCallback(async (dateForFilter) => {
    if (!dateForFilter || allStudents.length === 0) {
      setPresentStudents(allStudents.length > 0 ? allStudents : []);
      setLoadingAttendance(false);
      return;
    }
    setLoadingAttendance(true);
    setError('');
    try {
      const token = getToken();
      const response = await axios.get(`${API_BASE_URL}/attendance/status/${dateForFilter}`, { headers: { 'x-auth-token': token } });
      const attendanceRecords = response.data.attendance_records || [];
      const presentStudentIds = new Set(
        attendanceRecords
          .filter(record => record.status && !record.status.startsWith('AUSENCIA'))
          .map(record => record.student_id)
      );
      const filtered = allStudents.filter(student => presentStudentIds.has(student.id));
      setPresentStudents(filtered);
    } catch (err) {
      console.error(`Error fetching attendance for ${dateForFilter}:`, err);
      setError(err.response?.data?.message || err.message || `Error al cargar asistencia para ${dateForFilter}.`);
      setPresentStudents([]);
    } finally {
      setLoadingAttendance(false);
    }
  }, [getToken, allStudents, API_BASE_URL]);

  // Carga inicial de todos los estudiantes
  useEffect(() => {
    const fetchAllStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = getToken();
        const response = await axios.get(`${API_BASE_URL}/admin/students?active=true`, { headers: { 'x-auth-token': token } });
        setAllStudents(response.data);
      } catch (err) {
        console.error("Error fetching all students:", err);
        setError(err.response?.data?.message || err.message || 'Error al cargar lista completa de estudiantes.');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchAllStudents();
  }, [getToken, API_BASE_URL]);

  // Efecto para obtener estudiantes presentes cuando cambia la fecha o la lista de todos los estudiantes
  useEffect(() => {
    if (allStudents.length > 0) {
      fetchAttendanceAndFilterStudents(groupScoreDate);
    } else {
      setPresentStudents([]);
    }
  }, [groupScoreDate, allStudents, fetchAttendanceAndFilterStudents]);

  // useEffect para inicializar/resetear groupStudentStatus basado en presentStudents y groupScoreType
  useEffect(() => {
    const newStatus = {};
    presentStudents.forEach(student => {
      if (groupScoreType === 'CINCO_VALIENTES' || groupScoreType === 'PRIMER_GRUPO') {
        newStatus[student.id] = 'not_selected';
      } else {
        newStatus[student.id] = 'compliant';
      }
    });
    setGroupStudentStatus(newStatus);
  }, [presentStudents, groupScoreType]);

  useEffect(() => {
    if (personalSelectedStudent && !presentStudents.find(p => p.id === personalSelectedStudent)) {
      setPersonalSelectedStudent('');
    }
    if (presentStudents.length === 0 && personalSelectedStudent) {
        setPersonalSelectedStudent('');
    }
  }, [presentStudents, personalSelectedStudent]);

  const handleGroupStudentStatusChange = (studentId, status) => {
    setGroupStudentStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSpecialGroupSelection = (studentId, isSelected) => {
    if (groupScoreType === 'CINCO_VALIENTES') {
      const currentSelected = Object.keys(groupStudentStatus).filter(id => groupStudentStatus[id] === 'selected_for_bonus');
      if (isSelected && currentSelected.length >= 5 && !currentSelected.includes(studentId) ) {
        alert("Solo puedes seleccionar hasta 5 estudiantes para 'Cinco Valientes'.");
        return;
      }
    }
    setGroupStudentStatus(prev => ({
      ...prev,
      [studentId]: isSelected ? 'selected_for_bonus' : 'not_selected'
    }));
  };

  const countSelectedForBonus = () => Object.values(groupStudentStatus).filter(s => s === 'selected_for_bonus').length;

  const handleSubmitGroupScore = async (e) => {
    e.preventDefault(); setError(''); let payload = { score_type: groupScoreType, score_date: groupScoreDate };
    if (groupScoreType === 'CINCO_VALIENTES' || groupScoreType === 'PRIMER_GRUPO') {
      const student_ids = Object.entries(groupStudentStatus)
        .filter(([studentId, status]) => status === 'selected_for_bonus' && presentStudents.find(p => p.id === studentId))
        .map(([studentId, _]) => studentId);
      if (student_ids.length === 0) { alert("Por favor, seleccione al menos un estudiante presente."); return; }
      if (groupScoreType === 'CINCO_VALIENTES' && student_ids.length > 5) { alert("'Cinco Valientes' no puede tener más de 5 estudiantes."); return; }
      payload.student_ids = student_ids;
    } else {
      const students_compliant = []; const students_non_compliant = [];
      presentStudents.forEach(student => {
        const status = groupStudentStatus[student.id];
        if (status === 'compliant') { students_compliant.push(student.id); }
        else if (status === 'non_compliant') { students_non_compliant.push(student.id); }
      });
      if (students_compliant.length === 0 && students_non_compliant.length === 0 && presentStudents.length > 0) {
        alert("Por favor, marque el estado de al menos un estudiante presente."); return;
      } else if (presentStudents.length === 0 && (students_compliant.length > 0 || students_non_compliant.length > 0)) {
        alert("No hay estudiantes presentes para asignar puntajes."); return;
      }
      payload.students_compliant = students_compliant; payload.students_non_compliant = students_non_compliant;
    }
    try { const token = getToken(); const response = await axios.post(`${API_BASE_URL}/scores/group`, payload, { headers: { 'x-auth-token': token } }); alert(response.data.message || "Puntuaciones grupales registradas."); if (['ROPA_TRABAJO', 'LIMPIEZA', 'CINCO_VALIENTES', 'PRIMER_GRUPO'].includes(groupScoreType)) { /* El useEffect [presentStudents, groupScoreType] se encargará de resetear */ } }
    catch (err) { console.error("Error submitting group score:", err); setError(err.response?.data?.message || err.message || 'Error al registrar puntuaciones grupales.'); alert(`Error: ${err.response?.data?.message || err.message}`); }
  };

  const handlePersonalScoreTypeChange = (e) => { setPersonalScoreType(e.target.value); setPersonalPoints(''); setPersonalSubCategory(''); setPersonalNotes(''); };
  const handleSubmitPersonalScore = async (e) => {
    e.preventDefault(); setError(''); if (!personalSelectedStudent) { alert("Por favor, seleccione un estudiante."); return; }
    let pointsToAssign = parseInt(personalPoints, 10);
    if (personalScoreType === 'PARTICIPACION') { if (personalSubCategory === 'Participativo') pointsToAssign = 2; else if (personalSubCategory === 'Apático') pointsToAssign = -1; else { alert("Seleccione el nivel de participación."); return; } }
    else if (personalScoreType === 'EXTRA') { if (isNaN(pointsToAssign) || pointsToAssign === 0) { alert("Ingrese un valor numérico de puntos (diferente de cero) para Puntos Extra."); return; } }
    else if (personalScoreType === 'CONDUCTA' || personalScoreType === 'USO_CELULAR') { if (isNaN(pointsToAssign)) {alert("Seleccione una opción de puntos válida."); return;} }
    else if (isNaN(pointsToAssign)) { alert("Ingrese un valor numérico para los puntos."); return; }
    try { const token = getToken(); const payload = { student_id: personalSelectedStudent, score_type: personalScoreType, score_date: groupScoreDate, points_assigned: pointsToAssign, sub_category: personalSubCategory, notes: personalNotes }; const response = await axios.post(`${API_BASE_URL}/scores/personal`, payload, { headers: { 'x-auth-token': token } }); let alertMessage = response.data.message || "Puntuación personal registrada."; if (personalScoreType === 'CONDUCTA') { let timeOutMessage = ''; if (pointsToAssign === -3) timeOutMessage = "Recuerda: Enviar al alumno un tiempo fuera de 15 minutos."; else if (pointsToAssign === -2) timeOutMessage = "Recuerda: Enviar al alumno un tiempo fuera de 10 minutos."; else if (pointsToAssign === -1) timeOutMessage = "Recuerda: Enviar al alumno un tiempo fuera de 5 minutos."; if (timeOutMessage) { alertMessage += `\n${timeOutMessage}`; } } alert(alertMessage); setPersonalSelectedStudent(''); setPersonalPoints(''); setPersonalSubCategory(''); setPersonalNotes(''); }
    catch (err) { console.error("Error submitting personal score:", err); setError(err.response?.data?.message || err.message || 'Error al registrar puntuación personal.'); alert(`Error: ${err.response?.data?.message || err.message}`); }
  };

  if (loadingStudents && allStudents.length === 0) return <div className="content-page-container"><p className="text-center" style={{padding: '2rem'}}>Cargando estudiantes...</p></div>;

  return (
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Registrar Puntuaciones</h2>

      {error && <div className="error-message-page" style={{marginBottom: '1.5rem'}}>{error}</div>}

      <div className="score-section-card">
        <h3 className="section-title">Puntuaciones Grupales</h3>
        <form onSubmit={handleSubmitGroupScore}>
          <div className="score-form-group">
            <label htmlFor="groupScoreDate">Fecha para Puntuaciones:</label>
            <input type="date" id="groupScoreDate" value={groupScoreDate} onChange={(e) => setGroupScoreDate(e.target.value)} required />
          </div>
          <div className="score-form-group">
            <label htmlFor="groupScoreType">Tipo de Puntuación Grupal:</label>
            <select id="groupScoreType" value={groupScoreType} onChange={(e) => setGroupScoreType(e.target.value)}>
              <option value="ROPA_TRABAJO">Ropa de Trabajo (1 vez/día)</option>
              <option value="MATERIALES">Materiales (Acumulativo)</option>
              <option value="LIMPIEZA">Limpieza (1 vez/día)</option>
              <option value="CINCO_VALIENTES">Cinco Valientes (+1 c/u, 1 vez/día)</option>
              <option value="PRIMER_GRUPO">Primer Grupo (+1 c/u, 1 vez/día)</option>
            </select>
          </div>

          {(groupScoreType === 'ROPA_TRABAJO' || groupScoreType === 'MATERIALES' || groupScoreType === 'LIMPIEZA') && (
            <div className="score-form-group">
              <label className="student-list-label">Marcar Estudiantes (Presentes en fecha: {groupScoreDate}):</label>
              {loadingAttendance && <p className="text-center">Cargando asistencia...</p>}
              {!loadingAttendance && presentStudents.length === 0 && <p className="text-center" style={{color: 'var(--text-color-placeholder)', marginTop: '0.5rem'}}>No hay estudiantes presentes o no se cargó asistencia para esta fecha.</p>}
              {presentStudents.length > 0 &&
                <div className="student-selection-list">
                  {presentStudents.map(student => (
                    <div key={student.id}>
                      <label className="inline-label" style={{width: '100%', justifyContent: 'space-between'}}>
                        <span className="student-name">{student.full_name} ({student.id})</span>
                        <div>
                          <input type="radio" name={`group_status_${student.id}`} value="compliant" checked={groupStudentStatus[student.id] === 'compliant'} onChange={() => handleGroupStudentStatusChange(student.id, 'compliant')} /> Cumple (+1)
                          <input type="radio" name={`group_status_${student.id}`} value="non_compliant" checked={groupStudentStatus[student.id] === 'non_compliant'} onChange={() => handleGroupStudentStatusChange(student.id, 'non_compliant')} style={{marginLeft: '10px'}}/> No Cumple (-1)
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              }
            </div>
          )}

          {(groupScoreType === 'CINCO_VALIENTES' || groupScoreType === 'PRIMER_GRUPO') && (
            <div className="score-form-group">
              <label className="student-list-label">Seleccionar Estudiantes (Presentes en fecha: {groupScoreDate}):</label>
              {loadingAttendance && <p className="text-center">Cargando asistencia...</p>}
              {!loadingAttendance && presentStudents.length === 0 && <p className="text-center" style={{color: 'var(--text-color-placeholder)', marginTop: '0.5rem'}}>No hay estudiantes presentes o no se cargó asistencia para esta fecha.</p>}
              {presentStudents.length > 0 &&
                <div className="student-selection-list">
                  {presentStudents.map(student => (
                    <div key={student.id}>
                      <label>
                        <input type="checkbox" checked={groupStudentStatus[student.id] === 'selected_for_bonus'} onChange={(e) => handleSpecialGroupSelection(student.id, e.target.checked)} />
                        <span className="student-name" style={{marginLeft: '0.5rem'}}>{student.full_name} ({student.id})</span>
                      </label>
                    </div>
                  ))}
                </div>
              }
              {groupScoreType === 'CINCO_VALIENTES' &&
                <p className="student-selection-list-count" style={{color: countSelectedForBonus() > 5 ? 'var(--color-danger)' : 'inherit'}}>
                  Seleccionados: {countSelectedForBonus()} / 5
                </p>
              }
            </div>
          )}
          <button type="submit" className="btn-action btn-teacher" style={{width: '100%', marginTop: '1.5rem'}}><SaveIcon /> Registrar Puntuación Grupal</button>
        </form>
      </div>

      <div className="score-section-card">
        <h3 className="section-title">Puntuaciones Personales</h3>
        <form onSubmit={handleSubmitPersonalScore}>
          <div className="score-form-group">
            <label htmlFor="personalSelectedStudent">Estudiante:</label>
            <select id="personalSelectedStudent" value={personalSelectedStudent} onChange={(e) => setPersonalSelectedStudent(e.target.value)} required>
              <option value="">Seleccione un estudiante presente</option>
              {presentStudents.map(student => (
                <option key={student.id} value={student.id}>{student.full_name} ({student.id})</option>
              ))}
            </select>
          </div>
          <p className="date-reference-note">
            La fecha para esta puntuación personal será: <strong>{groupScoreDate}</strong> (misma que Puntuaciones Grupales).
          </p>
          <div className="score-form-group">
            <label htmlFor="personalScoreType">Tipo de Puntuación Personal:</label>
            <select id="personalScoreType" value={personalScoreType} onChange={handlePersonalScoreTypeChange}>
              <option value="PARTICIPACION">Participación</option>
              <option value="CONDUCTA">Conducta</option>
              <option value="USO_CELULAR">Uso de Celular</option>
              <option value="EXTRA">Puntos Extra</option>
            </select>
          </div>

          {personalScoreType === 'PARTICIPACION' && (
            <div className="score-form-group inline-radio-group">
              <label style={{display: 'block', marginBottom: '0.5rem'}}>Nivel de Participación:</label>
              <label><input type="radio" name="participacion_level" value="Participativo" checked={personalSubCategory === 'Participativo'} onChange={(e) => {setPersonalSubCategory(e.target.value); setPersonalPoints('2');}} /> Participativo (+2)</label>
              <label><input type="radio" name="participacion_level" value="Apático" checked={personalSubCategory === 'Apático'} onChange={(e) => {setPersonalSubCategory(e.target.value); setPersonalPoints('-1');}} /> Apático (-1)</label>
            </div>
          )}

          {personalScoreType === 'CONDUCTA' && (
            <div className="score-form-group">
              <label htmlFor="conductaPoints">Puntos por Conducta:</label>
              <select id="conductaPoints" value={personalPoints} onChange={(e) => setPersonalPoints(e.target.value)} required>
                <option value="">Seleccione puntos</option><option value="-1">-1 (Leve)</option><option value="-2">-2 (Media)</option><option value="-3">-3 (Grave)</option>
              </select>
              <div style={{marginTop: '0.8rem'}}>
                <label htmlFor="conductaSubCategory">Descripción Corta:</label>
                <input type="text" id="conductaSubCategory" value={personalSubCategory} onChange={(e) => setPersonalSubCategory(e.target.value)} placeholder="Ej: Interrupción, Falta de respeto" />
              </div>
            </div>
          )}

          {personalScoreType === 'USO_CELULAR' && (
             <div className="score-form-group">
              <label htmlFor="celularPoints">Puntos por Uso de Celular:</label>
              <select id="celularPoints" value={personalPoints} onChange={(e) => setPersonalPoints(e.target.value)} required>
                <option value="">Seleccione puntos</option><option value="-1">-1 (Advertencia)</option><option value="-3">-3 (Reiterado)</option>
              </select>
              <div style={{marginTop: '0.8rem'}}>
                <label htmlFor="celularSubCategory">Contexto:</label>
                <input type="text" id="celularSubCategory" value={personalSubCategory} onChange={(e) => setPersonalSubCategory(e.target.value)} placeholder="Ej: Durante explicación" />
              </div>
            </div>
          )}

          {personalScoreType === 'EXTRA' && (
            <div className="score-form-group">
              <label htmlFor="extraPoints">Puntos Extra (puede ser negativo):</label>
              <input type="number" id="extraPoints" value={personalPoints} onChange={(e) => setPersonalPoints(e.target.value)} placeholder="Ej: 5 o -2" required />
              <div style={{marginTop: '0.8rem'}}>
                <label htmlFor="extraSubCategory">Motivo/Descripción Breve:</label>
                <input type="text" id="extraSubCategory" value={personalSubCategory} onChange={(e) => setPersonalSubCategory(e.target.value)} placeholder="Ej: Ayuda excepcional, Trae utilería" />
              </div>
            </div>
          )}

          <div className="score-form-group">
            <label htmlFor="personalNotes">Notas Adicionales (opcional):</label>
            <textarea id="personalNotes" value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} rows="3" placeholder="Detalles..."></textarea>
          </div>
          <button type="submit" className="btn-action btn-teacher" style={{width: '100%', marginTop: '1.5rem'}}><SaveIcon/> Registrar Puntuación Personal</button>
        </form>
      </div>
    </div>
  );
};

export default TeacherScoresPage;
