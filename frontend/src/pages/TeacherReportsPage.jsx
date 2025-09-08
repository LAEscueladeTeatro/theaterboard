import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { GroupContext } from '../context/GroupContext';
import { API_BASE_URL } from '../config';

const ReportIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M15.992 2.012a.75.75 0 01.75.75v14.476a.75.75 0 01-1.28.53l-4.154-4.155a.75.75 0 00-1.06 0L5.53 17.773a.75.75 0 01-1.28-.531V2.762a.75.75 0 01.75-.75h10.992zM8.75 9.25a.75.75 0 000 1.5h2.5a.75.75 0 000-1.5h-2.5z" clipRule="evenodd" /></svg>;
const TrophyIcon = () => <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path fillRule="evenodd" d="M15.28 4.72a.75.75 0 010 1.06l-2.5 2.5a.75.75 0 01-1.06 0l-1-1a.75.75 0 111.06-1.06l.47.47L14.22 4.72a.75.75 0 011.06 0zm-4.78 4.03a.75.75 0 01-1.06 0l-1-1a.75.75 0 111.06-1.06l.47.47 2.5-2.5a.75.75 0 011.06 1.06l-3 3.001zM5.78 8.72a.75.75 0 010-1.06l2.5-2.5a.75.75 0 011.06 0L11.28 7.1a.75.75 0 11-1.06 1.06l-.47-.47-2.5 2.5a.75.75 0 01-1.06 0zM2.5 13.25a.75.75 0 01.75-.75h13.5a.75.75 0 010 1.5H3.25a.75.75 0 01-.75-.75zM3 15.25a.75.75 0 01.75-.75h12.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zM2 18a.75.75 0 000 1.5h16a.75.75 0 000-1.5H2z" clipRule="evenodd" /></svg>;

// --- Sub-component for Daily Summary ---
const DailySummary = ({ getToken, selectedGroupId }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleFetch = async () => {
        setLoading(true); setError(''); setSummaryData(null);
        try {
            const token = getToken();
            const params = { date: selectedDate };
            if (selectedGroupId && selectedGroupId !== 'all') {
                params.group_id = selectedGroupId;
            }
            const response = await axios.get(`${API_BASE_URL}/reports/daily-summary`, { params, headers: { 'x-auth-token': token } });
            setSummaryData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar el resumen.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="controls-bar" style={{justifyContent: 'center', gap: '1rem'}}>
                <div className="control-group">
                    <label htmlFor="selectedDate">Fecha:</label>
                    <input type="date" id="selectedDate" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
                </div>
                <button onClick={handleFetch} disabled={loading} className="btn-action btn-teacher">
                    <ReportIcon /> {loading ? 'Generando...' : 'Generar Resumen Diario'}
                </button>
            </div>
            {error && <div className="error-message-page">{error}</div>}
            {loading && <p className="text-center">Cargando...</p>}
            {summaryData && summaryData.dailySummary.length > 0 && (
                <div style={{overflowX: 'auto'}}>
                    <table className="styled-table">
                        <thead>
                            <tr><th>Estudiante</th><th>Asistencia</th><th>Bono</th><th>Scores Adic.</th><th>Total del Día</th></tr>
                        </thead>
                        <tbody>
                            {summaryData.dailySummary.map(item => (
                                <tr key={item.student_id}>
                                    <td>{item.full_name} ({item.nickname || item.student_id})</td>
                                    <td style={{textAlign: 'center'}}>{item.total_attendance_points}</td>
                                    <td style={{textAlign: 'center'}}>{item.total_bonus_points}</td>
                                    <td style={{textAlign: 'center'}}>{item.total_additional_scores}</td>
                                    <td style={{textAlign: 'center'}}><strong>{item.grand_total_points}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {summaryData && summaryData.dailySummary.length === 0 && <div className="empty-table-message">No hay datos para esta fecha.</div>}
        </div>
    );
};

// --- Sub-component for Monthly Ranking ---
const MonthlyRanking = ({ getToken, selectedGroupId }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [rankingData, setRankingData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchRanking = useCallback(async (monthToFetch) => {
        if (!monthToFetch) { setError('Por favor, seleccione un mes.'); setRankingData([]); return; }
        setLoading(true); setError('');
        try {
            const token = getToken();
            const params = { month: monthToFetch };
            if (selectedGroupId && selectedGroupId !== 'all') {
                params.group_id = selectedGroupId;
            }
            const response = await axios.get(`${API_BASE_URL}/reports/monthly-ranking`, { params, headers: { 'x-auth-token': token } });
            setRankingData(response.data.ranking || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al cargar el ranking.');
            setRankingData([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, selectedGroupId]);

    useEffect(() => { fetchRanking(selectedMonth); }, [fetchRanking, selectedMonth, selectedGroupId]);

    const getMedal = (index) => {
        if (index === 0) return '🥇'; if (index === 1) return '🥈'; if (index === 2) return '🥉';
        return `${index + 1}.`;
    };

    return (
        <div>
            <div className="controls-bar" style={{ justifyContent: 'center', gap: '1rem' }}>
                <div className="control-group">
                    <label htmlFor="selectedMonthRanking">Mes:</label>
                    <input type="month" id="selectedMonthRanking" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                </div>
            </div>
            {error && <div className="error-message-page">{error}</div>}
            {loading ? <p className="text-center">Cargando ranking...</p> : (
                rankingData.length === 0 ? <div className="empty-table-message">No hay datos para este mes.</div> :
                <div style={{ overflowX: 'auto' }}>
                    <table className="styled-table">
                        <thead>
                            <tr><th style={{width: '80px', textAlign: 'center'}}>#</th><th>Estudiante</th><th>Apodo</th><th style={{textAlign: 'right'}}>Puntaje Total</th></tr>
                        </thead>
                        <tbody>
                            {rankingData.map((student, index) => (
                                <tr key={student.student_id} className={index < 3 ? `rank-${index + 1}` : ''}>
                                    <td className="ranking-position">{getMedal(index)}</td>
                                    <td>{student.full_name}</td>
                                    <td>{student.nickname || '-'}</td>
                                    <td style={{textAlign: 'right'}}><strong>{student.grand_total_points}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// --- Sub-component for Student Summary ---
const StudentSummary = ({ getToken, selectedGroupId }) => {
    const [students, setStudents] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
    const [summaryData, setSummaryData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const token = getToken();
                const params = new URLSearchParams({ active: 'true' });
                if (selectedGroupId && selectedGroupId !== 'all') {
                    params.append('group_id', selectedGroupId);
                }
                const response = await axios.get(`${API_BASE_URL}/admin/students`, { headers: { 'x-auth-token': token }, params });
                setStudents(response.data);
                if (selectedStudent && !response.data.some(s => s.id === selectedStudent)) {
                    setSelectedStudent('');
                }
            } catch (err) { setError('No se pudo cargar la lista de estudiantes.'); }
        };
        fetchStudents();
    }, [getToken, selectedGroupId, selectedStudent]);

    const handleFetch = async () => {
        if (!selectedStudent || !selectedMonth) { setError('Por favor, seleccione un estudiante y un mes.'); return; }
        setLoading(true); setError(''); setSummaryData(null);
        try {
            const token = getToken();
            const response = await axios.get(`${API_BASE_URL}/reports/student-summary`, { params: { studentId: selectedStudent, month: selectedMonth }, headers: { 'x-auth-token': token } });
            setSummaryData(response.data);
        } catch (err) { setError(err.response?.data?.message || 'Error al cargar el resumen.'); }
        finally { setLoading(false); }
    };

    return (
        <div>
            <div className="controls-bar" style={{justifyContent: 'center', gap: '1rem'}}>
                <div className="control-group">
                    <label>Estudiante:</label>
                    <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)}>
                        <option value="">-- Seleccione --</option>
                        {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
                    </select>
                </div>
                <div className="control-group">
                    <label>Mes:</label>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                </div>
                <button onClick={handleFetch} disabled={loading || !selectedStudent} className="btn-action btn-teacher">
                    <ReportIcon /> {loading ? 'Generando...' : 'Generar Resumen'}
                </button>
            </div>
            {error && <div className="error-message-page">{error}</div>}
            {loading && <p className="text-center">Cargando...</p>}
            {summaryData && summaryData.summary && (
                <div className="summary-detail-card">
                    <h4>Resumen para: {summaryData.studentInfo.full_name}</h4>
                    <p>Mes: <strong>{new Date(summaryData.month + '-02').toLocaleDateString('es-PE', { month: 'long', year: 'numeric', timeZone: 'UTC' })}</strong></p>
                    <p><strong>Puntos de Asistencia:</strong> {summaryData.summary.totalAttendancePoints}</p>
                    <p><strong>Puntos de Bono:</strong> {summaryData.summary.totalBonusPoints}</p>
                    <p><strong>Puntos Adicionales:</strong> {summaryData.summary.totalAdditionalScores}</p>
                    <p className="grand-total">GRAN TOTAL: {summaryData.summary.grandTotalPoints}</p>
                </div>
            )}
        </div>
    );
};


// --- Sub-component for Exporting Students ---
const ExportStudents = ({ getToken, selectedGroupId }) => {
    const availableColumns = [
        { key: 'id', label: 'ID' },
        { key: 'full_name', label: 'Nombre Completo' },
        { key: 'nickname', label: 'Apodo' },
        { key: 'age', label: 'Edad' },
        { key: 'birth_date', label: 'Fecha de Nacimiento' },
        { key: 'phone', label: 'Celular' },
        { key: 'email', label: 'Email' },
        { key: 'guardian_full_name', label: 'Nombre del Apoderado' },
        { key: 'guardian_relationship', label: 'Parentesco' },
        { key: 'guardian_phone', label: 'Celular del Apoderado' },
        { key: 'guardian_email', label: 'Email del Apoderado' },
        { key: 'medical_conditions', label: 'Condiciones Médicas' },
        { key: 'comments', label: 'Comentarios' },
        { key: 'emergency_contact_name', label: 'Contacto de Emergencia' },
        { key: 'emergency_contact_phone', label: 'Celular de Emergencia' },
        { key: 'group_name', label: 'Grupo' },
    ];

    const [selectedColumns, setSelectedColumns] = useState(['id', 'full_name']);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleColumnChange = (e) => {
        const { value, checked } = e.target;
        setSelectedColumns(prev =>
            checked ? [...prev, value] : prev.filter(col => col !== value)
        );
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedColumns(availableColumns.map(col => col.key));
        } else {
            setSelectedColumns([]);
        }
    };

    const handleExport = async () => {
        if (selectedColumns.length === 0) {
            setError('Debes seleccionar al menos una columna para exportar.');
            return;
        }

        setLoading(true);
        setError('');
        try {
            const token = getToken();
            const params = {
                columns: selectedColumns.join(','),
                group_id: selectedGroupId || 'all',
            };

            const response = await axios.get(`${API_BASE_URL}/reports/export/students`, {
                params,
                headers: { 'x-auth-token': token },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            const filename = `estudiantes-${params.group_id}-${new Date().toISOString().split('T')[0]}.xls`;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            if (err.response && err.response.data) {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result);
                        setError(errorData.message || 'Error desconocido al exportar.');
                    } catch (e) {
                        setError('Error al procesar la respuesta del servidor.');
                    }
                };
                reader.onerror = () => { setError('No se pudo leer el error de la respuesta.'); };
                reader.readAsText(err.response.data);
            } else {
                setError('Error de red o de servidor al intentar exportar.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="export-columns-container">
                <h4>Selecciona las columnas a exportar:</h4>
                <div className="checkbox-group select-all-group">
                    <input
                        type="checkbox"
                        id="select-all"
                        onChange={handleSelectAll}
                        checked={selectedColumns.length === availableColumns.length}
                    />
                    <label htmlFor="select-all"><strong>Seleccionar Todo</strong></label>
                </div>
                <div className="checkbox-grid">
                    {availableColumns.map(col => (
                        <div key={col.key} className="checkbox-group">
                            <input
                                type="checkbox"
                                id={`col-${col.key}`}
                                value={col.key}
                                checked={selectedColumns.includes(col.key)}
                                onChange={handleColumnChange}
                            />
                            <label htmlFor={`col-${col.key}`}>{col.label}</label>
                        </div>
                    ))}
                </div>
            </div>

            <div className="controls-bar" style={{ justifyContent: 'center', marginTop: '1.5rem' }}>
                <button onClick={handleExport} disabled={loading} className="btn-action btn-export">
                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="16" height="16"><path d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.155a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.155V3.75A.75.75 0 0110 3z M3.75 16.5a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.5a.75.75 0 01-.75-.75z" /></svg>
                    {loading ? 'Exportando...' : 'Exportar a XLS'}
                </button>
            </div>
            {error && <div className="error-message-page" style={{textAlign: 'center', marginTop: '1rem'}}>{error}</div>}
             <div className="info-box-centered" style={{marginTop: '2rem'}}>
                <p>La exportación se realizará para el <strong>grupo seleccionado en el filtro principal</strong>.</p>
                <p>Si desea exportar <strong>todos los estudiantes</strong>, asegúrese de que el filtro de grupo esté en "Todos los Grupos".</p>
            </div>
        </div>
    );
};

// --- Main Page Component ---
const TeacherReportsPage = () => {
    const [activeTab, setActiveTab] = useState('daily_summary');
    const { selectedGroupId } = useContext(GroupContext);
    const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

    const renderContent = () => {
        const props = { getToken, selectedGroupId };
        switch (activeTab) {
            case 'daily_summary':
                return <DailySummary {...props} />;
            case 'monthly_ranking':
                return <MonthlyRanking {...props} />;
            case 'student_summary':
                return <StudentSummary {...props} />;
            case 'export_students':
                return <ExportStudents {...props} />;
            default:
                return null;
        }
    };

    return (
        <div className="content-page-container">
            <div className="page-header-controls">
                <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
            </div>
            <h2 className="page-title">Informes y Resúmenes</h2>

            <div className="modal-tabs">
                <button className={`tab-button ${activeTab === 'daily_summary' ? 'active' : ''}`} onClick={() => setActiveTab('daily_summary')}>Resumen Diario</button>
                <button className={`tab-button ${activeTab === 'monthly_ranking' ? 'active' : ''}`} onClick={() => setActiveTab('monthly_ranking')}>Ranking Mensual</button>
                <button className={`tab-button ${activeTab === 'student_summary' ? 'active' : ''}`} onClick={() => setActiveTab('student_summary')}>Resumen por Alumno</button>
                <button className={`tab-button ${activeTab === 'export_students' ? 'active' : ''}`} onClick={() => setActiveTab('export_students')}>Exportar Alumnos</button>
            </div>

            <div className="reports-content" style={{marginTop: '1.5rem'}}>
                {renderContent()}
            </div>
        </div>
    );
};

export default TeacherReportsPage;
