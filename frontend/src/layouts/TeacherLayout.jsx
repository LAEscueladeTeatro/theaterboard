import React, { useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import axios from 'axios';
import { useGroup } from '../context/GroupContext';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

const TeacherLayout = () => {
    const [groups, setGroups] = useState([]);
    const { selectedGroupId, setSelectedGroupId } = useGroup();
    const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const token = getToken();
                const { data } = await axios.get(`${API_BASE_URL}/groups`, {
                    headers: { 'x-auth-token': token },
                });
                setGroups(data);
            } catch (err) {
                console.error("Error fetching groups for layout:", err);
                toast.error("No se pudo cargar la lista de grupos para el filtro.");
            }
        };
        fetchGroups();
    }, [getToken]);

    return (
        <div>
            <header className="teacher-panel-header">
                <h3>Panel de Docente</h3>
                <div className="global-filter-container">
                    <label htmlFor="groupFilter">Filtrar por Grupo:</label>
                    <select
                        id="groupFilter"
                        value={selectedGroupId}
                        onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="global-group-filter"
                    >
                        <option value="all">Todos los Grupos</option>
                        {groups.map(group => (
                            <option key={group.group_id} value={group.group_id}>
                                {group.name}
                            </option>
                        ))}
                    </select>
                </div>
            </header>
            <main className="teacher-panel-content">
                <Outlet />
            </main>
        </div>
    );
};

export default TeacherLayout;
