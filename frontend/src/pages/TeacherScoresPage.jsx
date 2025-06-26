import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const TeacherScoresPage = () => {
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [error, setError] = useState('');
  const API_URL = 'http://localhost:3001/api';
  const todayDateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  // Estados para Puntuaciones Grupales
  const [groupScoreType, setGroupScoreType] = useState('ROPA_TRABAJO');
  const [groupScoreDate, setGroupScoreDate] = useState(todayDateString);
  const [groupStudentStatus, setGroupStudentStatus] = useState({}); // { student_id: 'compliant' | 'non_compliant' | 'not_applicable' }

  // Estados para Puntuaciones Personales
  const [personalSelectedStudent, setPersonalSelectedStudent] = useState('');
  const [personalScoreType, setPersonalScoreType] = useState('PARTICIPACION');
  const [personalScoreDate, setPersonalScoreDate] = useState(todayDateString);
  const [personalPoints, setPersonalPoints] = useState(''); // Para conducta o uso celular, o deducido para participación
  const [personalSubCategory, setPersonalSubCategory] = useState('');
  const [personalNotes, setPersonalNotes] = useState('');

  const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

  // Cargar lista de estudiantes
  useEffect(() => {
    const fetchStudents = async () => {
      setLoadingStudents(true);
      try {
        const token = getToken();
        const response = await axios.get(`${API_URL}/students`, { headers: { 'x-auth-token': token } });
        setStudents(response.data);
        // Inicializar groupStudentStatus para todos los estudiantes como 'not_applicable' o 'compliant' por defecto
        const initialStatus = {};
        response.data.forEach(student => {
          initialStatus[student.id] = 'compliant'; // O 'not_applicable' si se prefiere empezar sin marcar
        });
        setGroupStudentStatus(initialStatus);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError(err.response?.data?.message || err.message || 'Error al cargar estudiantes.');
      } finally {
        setLoadingStudents(false);
      }
    };
    fetchStudents();
  }, [getToken]);

  const handleGroupStudentStatusChange = (studentId, status) => {
    setGroupStudentStatus(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitGroupScore = async (e) => {
    e.preventDefault();
    setError('');
    const students_compliant = [];
    const students_non_compliant = [];

    for (const studentId in groupStudentStatus) {
      if (groupStudentStatus[studentId] === 'compliant') {
        students_compliant.push(studentId);
      } else if (groupStudentStatus[studentId] === 'non_compliant') {
        students_non_compliant.push(studentId);
      }
    }

    if (students_compliant.length === 0 && students_non_compliant.length === 0) {
      alert("Por favor, marque el estado de al menos un estudiante.");
      return;
    }

    try {
      const token = getToken();
      const payload = {
        score_type: groupScoreType,
        score_date: groupScoreDate,
        students_compliant,
        students_non_compliant
      };
      const response = await axios.post(`${API_URL}/scores/group`, payload, { headers: { 'x-auth-token': token } });
      alert(response.data.message || "Puntuaciones grupales registradas.");
      // Resetear o actualizar UI según sea necesario
    } catch (err) {
      console.error("Error submitting group score:", err);
      setError(err.response?.data?.message || err.message || 'Error al registrar puntuaciones grupales.');
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };

  const handlePersonalScoreTypeChange = (e) => {
    setPersonalScoreType(e.target.value);
    setPersonalPoints(''); // Resetear puntos al cambiar tipo
    setPersonalSubCategory('');
    setPersonalNotes('');
  };

  const handleSubmitPersonalScore = async (e) => {
    e.preventDefault();
    setError('');

    if (!personalSelectedStudent) {
      alert("Por favor, seleccione un estudiante.");
      return;
    }

    let pointsToAssign = parseInt(personalPoints, 10); // Asegurar que es un número

    // Validaciones específicas y asignación de puntos para participación
    if (personalScoreType === 'PARTICIPACION') {
        if (personalSubCategory === 'Participativo') pointsToAssign = 2;
        else if (personalSubCategory === 'Apático') pointsToAssign = -1;
        else {
            alert("Seleccione el nivel de participación.");
            return;
        }
    } else { // Para CONDUCTA y USO_CELULAR, los puntos se ingresan directamente
        if (isNaN(pointsToAssign)) {
            alert("Ingrese un valor numérico para los puntos.");
            return;
        }
    }


    try {
      const token = getToken();
      const payload = {
        student_id: personalSelectedStudent,
        score_type: personalScoreType,
        score_date: personalScoreDate,
        points_assigned: pointsToAssign,
        sub_category: personalSubCategory,
        notes: personalNotes,
      };
      const response = await axios.post(`${API_URL}/scores/personal`, payload, { headers: { 'x-auth-token': token } });
      alert(response.data.message || "Puntuación personal registrada.");
      // Resetear formulario personal
      setPersonalSelectedStudent('');
      // setPersonalScoreType('PARTICIPACION'); // O mantener el último tipo
      setPersonalPoints('');
      setPersonalSubCategory('');
      setPersonalNotes('');
    } catch (err) {
      console.error("Error submitting personal score:", err);
      setError(err.response?.data?.message || err.message || 'Error al registrar puntuación personal.');
      alert(`Error: ${err.response?.data?.message || err.message}`);
    }
  };


  if (loadingStudents) return <p>Cargando estudiantes...</p>;
  // if (error) return <div><p style={{color: 'red'}}>Error: {error}</p><Link to="/docente/dashboard">Volver al Panel</Link></div>;


  return (
    <div>
      <h2>Registrar Puntuaciones</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>
      {error && <p style={{color: 'red'}}>Error: {error}</p>}

      {/* Sección de Puntuaciones Grupales */}
      <section style={{marginTop: '20px', marginBottom: '30px', padding: '15px', border: '1px solid #ccc'}}>
        <h3>Puntuaciones Grupales</h3>
        <form onSubmit={handleSubmitGroupScore}>
          <div>
            <label htmlFor="groupScoreDate">Fecha: </label>
            <input type="date" id="groupScoreDate" value={groupScoreDate} onChange={(e) => setGroupScoreDate(e.target.value)} required />
          </div>
          <div style={{marginTop: '10px'}}>
            <label htmlFor="groupScoreType">Tipo de Puntuación Grupal: </label>
            <select id="groupScoreType" value={groupScoreType} onChange={(e) => setGroupScoreType(e.target.value)}>
              <option value="ROPA_TRABAJO">Ropa de Trabajo</option>
              <option value="MATERIALES">Materiales</option>
              <option value="LIMPIEZA">Limpieza</option>
            </select>
          </div>

          <div style={{marginTop: '15px'}}>
            <h4>Marcar Estudiantes:</h4>
            {students.map(student => (
              <div key={student.id} style={{marginBottom: '5px'}}>
                <span>{student.full_name} ({student.id}): </span>
                <label><input type="radio" name={`group_${student.id}`} value="compliant" checked={groupStudentStatus[student.id] === 'compliant'} onChange={() => handleGroupStudentStatusChange(student.id, 'compliant')} /> Cumple (+1)</label>
                <label><input type="radio" name={`group_${student.id}`} value="non_compliant" checked={groupStudentStatus[student.id] === 'non_compliant'} onChange={() => handleGroupStudentStatusChange(student.id, 'non_compliant')} /> No Cumple (-1)</label>
                {/* <label><input type="radio" name={`group_${student.id}`} value="not_applicable" checked={groupStudentStatus[student.id] === 'not_applicable'} onChange={() => handleGroupStudentStatusChange(student.id, 'not_applicable')} /> No Aplica</label> */}
              </div>
            ))}
          </div>
          <button type="submit" style={{marginTop: '15px'}}>Registrar Puntuación Grupal</button>
        </form>
      </section>

      {/* Sección de Puntuaciones Personales */}
      <section style={{marginTop: '20px', padding: '15px', border: '1px solid #ccc'}}>
        <h3>Puntuaciones Personales</h3>
        <form onSubmit={handleSubmitPersonalScore}>
          <div>
            <label htmlFor="personalSelectedStudent">Estudiante: </label>
            <select id="personalSelectedStudent" value={personalSelectedStudent} onChange={(e) => setPersonalSelectedStudent(e.target.value)} required>
              <option value="">Seleccione un estudiante</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>{student.full_name} ({student.id})</option>
              ))}
            </select>
          </div>
          <div style={{marginTop: '10px'}}>
            <label htmlFor="personalScoreDate">Fecha: </label>
            <input type="date" id="personalScoreDate" value={personalScoreDate} onChange={(e) => setPersonalScoreDate(e.target.value)} required />
          </div>
          <div style={{marginTop: '10px'}}>
            <label htmlFor="personalScoreType">Tipo de Puntuación Personal: </label>
            <select id="personalScoreType" value={personalScoreType} onChange={handlePersonalScoreTypeChange}>
              <option value="PARTICIPACION">Participación</option>
              <option value="CONDUCTA">Conducta</option>
              <option value="USO_CELULAR">Uso de Celular</option>
            </select>
          </div>

          {/* Campos específicos por tipo de puntuación personal */}
          {personalScoreType === 'PARTICIPACION' && (
            <div style={{marginTop: '10px'}}>
              <label>Nivel de Participación: </label>
              <label><input type="radio" name="participacion_level" value="Participativo" checked={personalSubCategory === 'Participativo'} onChange={(e) => setPersonalSubCategory(e.target.value)} /> Participativo (+2)</label>
              <label><input type="radio" name="participacion_level" value="Apático" checked={personalSubCategory === 'Apático'} onChange={(e) => setPersonalSubCategory(e.target.value)} /> Apático (-1)</label>
            </div>
          )}

          {personalScoreType === 'CONDUCTA' && (
            <div style={{marginTop: '10px'}}>
              <label htmlFor="conductaPoints">Puntos por Conducta: </label>
              <select id="conductaPoints" value={personalPoints} onChange={(e) => setPersonalPoints(e.target.value)} required>
                <option value="">Seleccione puntos</option>
                <option value="-1">-1 (Leve)</option>
                <option value="-2">-2 (Media)</option>
                <option value="-3">-3 (Grave)</option>
              </select>
              <div style={{marginTop: '5px'}}>
                <label htmlFor="conductaSubCategory">Descripción Corta (ej: Falta Leve): </label>
                <input type="text" id="conductaSubCategory" value={personalSubCategory} onChange={(e) => setPersonalSubCategory(e.target.value)} placeholder="Ej: Interrupción" />
              </div>
            </div>
          )}

          {personalScoreType === 'USO_CELULAR' && (
             <div style={{marginTop: '10px'}}>
              <label htmlFor="celularPoints">Puntos por Uso de Celular: </label>
              <select id="celularPoints" value={personalPoints} onChange={(e) => setPersonalPoints(e.target.value)} required>
                <option value="">Seleccione puntos</option>
                <option value="-1">-1 (Advertencia/Uso breve)</option>
                <option value="-3">-3 (Uso reiterado/Ignorar indicación)</option>
              </select>
              <div style={{marginTop: '5px'}}>
                <label htmlFor="celularSubCategory">Contexto (ej: Uso en clase): </label>
                <input type="text" id="celularSubCategory" value={personalSubCategory} onChange={(e) => setPersonalSubCategory(e.target.value)} placeholder="Ej: Durante explicación" />
              </div>
            </div>
          )}

          {(personalScoreType === 'CONDUCTA' || personalScoreType === 'USO_CELULAR') && (
            <div style={{marginTop: '10px'}}>
                {/* Este input de puntos es redundante si se usa el select, pero lo dejo por si se quiere más flexibilidad */}
                {/* <label htmlFor="personalPoints">Puntos Asignados (manual): </label> */}
                {/* <input type="number" id="personalPoints" value={personalPoints} onChange={(e) => setPersonalPoints(e.target.value)} placeholder="Puntos" /> */}
            </div>
          )}

          <div style={{marginTop: '10px'}}>
            <label htmlFor="personalNotes">Notas Adicionales: </label>
            <textarea id="personalNotes" value={personalNotes} onChange={(e) => setPersonalNotes(e.target.value)} rows="3" style={{width: '90%'}} placeholder="Detalles..."></textarea>
          </div>
          <button type="submit" style={{marginTop: '15px'}}>Registrar Puntuación Personal</button>
        </form>
      </section>
    </div>
  );
};

export default TeacherScoresPage;
