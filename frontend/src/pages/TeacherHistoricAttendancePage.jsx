import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TeacherAttendancePage from './TeacherAttendancePage';

const TeacherHistoricAttendancePage = () => {
  const [selectedDate, setSelectedDate] = useState('');
  const [showAttendance, setShowAttendance] = useState(false);

  const handleDateChange = (event) => {
    setSelectedDate(event.target.value);
    setShowAttendance(false);
  };

  const handleLoadAttendance = () => {
    if (selectedDate) {
      setShowAttendance(true);
    } else {
      alert('Por favor, seleccione una fecha.');
    }
  };

  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div>
      <h2>Ingresar Registro Pasado de Asistencia</h2>
      <Link to="/docente/dashboard">Volver al Panel</Link>
      <div style={{ margin: '20px 0' }}>
        <label htmlFor="historic-date">Seleccione una fecha:</label>
        <input
          type="date"
          id="historic-date"
          value={selectedDate}
          onChange={handleDateChange}
          max={getTodayDateString()}
          style={{ marginLeft: '10px' }}
        />
        <button onClick={handleLoadAttendance} style={{ marginLeft: '10px' }} disabled={!selectedDate}>
          Cargar Interfaz de Asistencia
        </button>
      </div>

      {showAttendance && selectedDate && (
        <div>
          <hr />
          <h3 style={{ fontWeight: 'bold', color: 'blue' }}>
            Interfaz de Asistencia para la fecha: {selectedDate}
          </h3>
          <TeacherAttendancePage selectedDate={selectedDate} />
        </div>
      )}
    </div>
  );
};

export default TeacherHistoricAttendancePage;
