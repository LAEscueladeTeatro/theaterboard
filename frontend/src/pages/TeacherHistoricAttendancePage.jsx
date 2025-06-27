import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import TeacherAttendancePage from './TeacherAttendancePage';

const CalendarDaysIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c0-.414.336-.75.75-.75h10.5a.75.75 0 01.75.75v.75a.75.75 0 01-.75.75H5.5a.75.75 0 01-.75-.75V7.5z" clipRule="evenodd" /></svg>;

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
    <div className="content-page-container">
      <div className="page-header-controls">
        <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
      </div>
      <h2 className="page-title">Ingresar Registro Pasado de Asistencia</h2>

      <div className="controls-section">
        <div className="control-group" style={{ justifyContent: 'center', alignItems: 'flex-end', gap: '1rem' }}> {/* Alinea items al final para que el botón quede bien con el input date */}
          <label htmlFor="historic-date" style={{marginBottom: '0.5rem', whiteSpace:'nowrap'}}>Seleccione una fecha:</label>
          <input
            type="date"
            id="historic-date"
            value={selectedDate}
            onChange={handleDateChange}
            max={getTodayDateString()}
            style={{flexGrow: '0', minWidth: '180px'}} // Para que no crezca demasiado
          />
          <button
            onClick={handleLoadAttendance}
            className="btn-action btn-teacher"
            style={{minWidth: 'auto', padding: '0.7em 1.2em'}} // Hacerlo un poco más pequeño
            disabled={!selectedDate}
          >
            <CalendarDaysIcon /> Cargar Interfaz
          </button>
        </div>
      </div>

      {showAttendance && selectedDate && (
        <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color-subtle)' }}>
          <h3 className="page-subtitle" style={{ fontSize: '1.5rem', color: 'var(--text-color-light)'}}>
            Editando Asistencia para la fecha: <strong>{selectedDate}</strong>
          </h3>
          <TeacherAttendancePage selectedDate={selectedDate} />
        </div>
      )}
    </div>
  );
};

export default TeacherHistoricAttendancePage;
