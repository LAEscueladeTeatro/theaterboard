import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import ConfirmationModal from '../components/ConfirmationModal';

const GroupManagementPage = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [editingGroup, setEditingGroup] = useState(null);
    const [newGroup, setNewGroup] = useState({ name: '', schedule_description: '' });

    // State for delete confirmation modal
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [groupToDelete, setGroupToDelete] = useState(null);

    const getToken = useCallback(() => localStorage.getItem('teacherToken'), []);

    const fetchGroups = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const { data } = await axios.get(`${API_BASE_URL}/groups`, {
                headers: { 'x-auth-token': token }
            });
            setGroups(data);
        } catch (err) {
            setError('Error al cargar los grupos.');
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!newGroup.name) {
            setError('El nombre del grupo no puede estar vacío.');
            return;
        }
        try {
            const token = getToken();
            const { data } = await axios.post(`${API_BASE_URL}/groups`, newGroup, {
                headers: { 'x-auth-token': token }
            });
            setGroups([...groups, data]);
            setNewGroup({ name: '', schedule_description: '' });
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al crear el grupo.');
        }
    };

    const handleUpdate = async (group) => {
        if (!group.name) {
            setError('El nombre del grupo no puede estar vacío.');
            return;
        }
        try {
            const token = getToken();
            const { data } = await axios.put(`${API_BASE_URL}/groups/${group.group_id}`, group, {
                headers: { 'x-auth-token': token }
            });
            setGroups(groups.map(g => (g.group_id === group.group_id ? data : g)));
            setEditingGroup(null);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Error al actualizar el grupo.');
        }
    };

    const handleDelete = (group) => {
        setGroupToDelete(group);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!groupToDelete) return;
        try {
            const token = getToken();
            await axios.delete(`${API_BASE_URL}/groups/${groupToDelete.group_id}`, {
                headers: { 'x-auth-token': token }
            });
            setGroups(groups.filter(g => g.group_id !== groupToDelete.group_id));
            setShowDeleteModal(false);
            setGroupToDelete(null);
        } catch (err) {
            setError(err.response?.data?.message || 'Error al eliminar el grupo.');
            setShowDeleteModal(false);
        }
    };

    const renderGroupRow = (group) => {
        const isEditing = editingGroup?.group_id === group.group_id;

        return (
            <tr key={group.group_id}>
                <td>{isEditing ? <input type="text" value={editingGroup.name} onChange={(e) => setEditingGroup({...editingGroup, name: e.target.value})} /> : group.name}</td>
                <td>{isEditing ? <input type="text" value={editingGroup.schedule_description} onChange={(e) => setEditingGroup({...editingGroup, schedule_description: e.target.value})} /> : group.schedule_description}</td>
                <td className="actions-cell">
                    {isEditing ? (
                        <>
                            <button onClick={() => handleUpdate(editingGroup)} className="btn-action btn-save">Guardar</button>
                            <button onClick={() => setEditingGroup(null)} className="btn-action btn-cancel">Cancelar</button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => setEditingGroup({...group})} className="btn-action btn-edit">Editar</button>
                            <button onClick={() => handleDelete(group)} className="btn-action btn-delete">Eliminar</button>
                        </>
                    )}
                </td>
            </tr>
        );
    };

    return (
        <div className="content-page-container">
            <div className="page-header-controls">
                <Link to="/docente/dashboard" className="back-link">&larr; Volver al Panel</Link>
            </div>
            <h2 className="page-title">Gestionar Grupos</h2>

            {error && <div className="error-message-page">{error}</div>}

            <div className="card">
                <h3 className="card-header">Crear Nuevo Grupo</h3>
                <form onSubmit={handleCreate} className="card-content form-grid">
                    <div className="form-group">
                        <label htmlFor="new-group-name">Nombre del Grupo</label>
                        <input
                            id="new-group-name"
                            type="text"
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                            placeholder="Ej: Grupo de los Sábados"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="new-group-schedule">Descripción / Horario</label>
                        <input
                            id="new-group-schedule"
                            type="text"
                            value={newGroup.schedule_description}
                            onChange={(e) => setNewGroup({ ...newGroup, schedule_description: e.target.value })}
                            placeholder="Ej: Sábados de 3 a 5 PM"
                        />
                    </div>
                    <div className="form-group">
                        <button type="submit" className="btn-action btn-add-student">Crear Grupo</button>
                    </div>
                </form>
            </div>

            <div className="card" style={{ marginTop: '2rem' }}>
                <h3 className="card-header">Lista de Grupos</h3>
                <div className="card-content" style={{ overflowX: 'auto' }}>
                    {loading ? <p>Cargando grupos...</p> : (
                        <table className="styled-table">
                            <thead>
                                <tr>
                                    <th>Nombre</th>
                                    <th>Descripción / Horario</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {groups.map(renderGroupRow)}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {showDeleteModal && (
                <ConfirmationModal
                    message={`¿Estás seguro de que quieres eliminar el grupo "${groupToDelete?.name}"? Esta acción no se puede deshacer.`}
                    onConfirm={confirmDelete}
                    onCancel={() => setShowDeleteModal(false)}
                />
            )}
        </div>
    );
};

export default GroupManagementPage;
