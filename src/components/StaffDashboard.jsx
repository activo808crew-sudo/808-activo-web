import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ParallaxBackground from './ParallaxBackground';

// Icons
const IconPlus = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M12 5v14" /></svg>;
const IconTrash = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>;
const IconEdit = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>;
const IconKey = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></svg>;
const IconUsers = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const IconLogOut = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>;
const IconCopy = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></svg>;
const IconCheck = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>;
const IconVideo = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>;
const IconActivity = () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>;

export default function StaffDashboard() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('events'); // events, streamers, audit, keys, roles

    // Data states
    const [events, setEvents] = useState([]);
    const [staffKeys, setStaffKeys] = useState([]);
    const [users, setUsers] = useState([]);
    const [streamers, setStreamers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);

    // Form states
    const [eventForm, setEventForm] = useState({
        title: '', description: '',
        image_url: '', section: 'main',
        start_date: '', start_time: '', recurrence: 'none'
    });
    const [editingEventId, setEditingEventId] = useState(null);

    const [streamerForm, setStreamerForm] = useState({ channel_id: '' });

    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        } else {
            navigate('/staff');
        }

        fetchEvents();
    }, [navigate]);

    // Fetch logic
    const fetchEvents = async () => {
        const token = localStorage.getItem('token');
        try {
            const [resMain, resMc] = await Promise.all([
                fetch('/api/events/list-dashboard?section=main', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/events/list-dashboard?section=minecraft', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            const dataMain = await resMain.json();
            const dataMc = await resMc.json();
            setEvents([...(dataMain.events || []), ...(dataMc.events || [])]);
        } catch (e) {
            console.error(e);
        }
    };

    const fetchKeys = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/staff-keys/list', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setStaffKeys(data.staffKeys);
        } catch (e) { console.error(e); }
    };


    const fetchUsers = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/roles/list-users', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (data.success) setUsers(data.users);
        } catch (e) { console.error(e); }
    };

    const fetchStreamers = async () => {
        try {
            // Public endpoint for now, or protected? List is public usually, but Management is private.
            // Dashboard uses the same list endpoint, but maybe we want a management one? 
            // Re-using public list is fine.
            const res = await fetch('/api/streamers/list');
            const data = await res.json();
            // Assuming list returns array or { streamers: [] } ?
            // My api/streamers/list.js returns res.json(rows) -> array.
            if (Array.isArray(data)) setStreamers(data);
        } catch (e) { console.error(e); }
    };

    const fetchAuditLogs = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/audit/list', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) setAuditLogs(data);
        } catch (e) { console.error(e); }
    };

    // Switch tabs and load data
    useEffect(() => {
        if (activeTab === 'events') fetchEvents();
        if (activeTab === 'keys') fetchKeys();
        if (activeTab === 'roles') fetchUsers();
        if (activeTab === 'streamers') fetchStreamers();
        if (activeTab === 'audit') fetchAuditLogs();
    }, [activeTab]);

    // Actions
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/staff');
    };

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 5000);
    };

    // --- EVENTS ---
    const handleCreateOrUpdateEvent = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        const url = editingEventId ? `/api/events/update?id=${editingEventId}` : '/api/events/create';
        const method = editingEventId ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(eventForm)
            });
            const data = await res.json();

            if (res.ok) {
                // Use the custom message from the backend (varies by role/status)
                showMsg('success', data.message || (editingEventId ? 'Evento actualizado' : 'Evento creado exitosamente'));
                setEventForm({
                    title: '', description: '',
                    image_url: '', section: 'main',
                    start_date: '', start_time: '', recurrence: 'none'
                });
                setEditingEventId(null);
                fetchEvents();
            } else {
                showMsg('error', data.error);
            }
        } catch (err) {
            showMsg('error', 'Error al guardar evento');
        } finally {
            setLoading(false);
        }
    };

    const handleEditEvent = (evt) => {
        setEventForm({
            title: evt.title,
            description: evt.description,
            image_url: evt.image || evt.image_url,
            section: evt.section,
            start_date: evt.start_date || '',
            start_time: evt.start_time || '',
            recurrence: evt.recurrence || 'none'
        });
        setEditingEventId(evt.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEventForm({
            title: '', description: '',
            image_url: '', section: 'main'
        });
        setEditingEventId(null);
    };

    const handleDeleteEvent = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este evento?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/events/delete?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Show message from server (different for staff vs director/owner)
                showMsg('success', data.message || 'Evento eliminado');
                fetchEvents();
            } else {
                const data = await res.json();
                showMsg('error', data.error || 'Error al eliminar');
            }
        } catch (err) { console.error(err); }
    };

    // --- STREAMERS ---
    const handleApprove = async (eventId, title, action) => {
        if (!confirm(`¿${action === 'approve' ? 'Aprobar' : 'Rechazar'} el evento "${title}"?`)) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/events/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ eventId, action })
            });

            if (res.ok) {
                showMsg('success', `Evento ${action === 'approve' ? 'aprobado' : 'rechazado'}`);
                fetchEvents();
            } else {
                const d = await res.json();
                showMsg('error', d.error);
            }
        } catch (e) { console.error(e); }
    };

    const handleAddStreamer = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/streamers/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ name: streamerForm.channel_id, platform: 'twitch', channel_id: streamerForm.channel_id })
            });
            const data = await res.json();
            if (res.ok) {
                showMsg('success', 'Streamer agregado');
                setStreamerForm({ channel_id: '' });
                fetchStreamers();
            } else {
                showMsg('error', data.error || 'Error al agregar');
            }
        } catch (e) { showMsg('error', 'Error de conexión'); }
        finally { setLoading(false); }
    };

    const handleDeleteStreamer = async (id) => {
        if (!confirm('¿Eliminar streamer?')) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/streamers/delete?id=${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                showMsg('success', 'Streamer eliminado');
                fetchStreamers();
            }
        } catch (e) { console.error(e); }
    };

    // --- KEYS & ROLES ---
    const handleGenerateKey = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/staff-keys/generate', {
                method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok) {
                showMsg('success', 'Nueva clave generada');
                fetchKeys();
            } else {
                showMsg('error', data.error);
            }
        } catch (err) { showMsg('error', 'Error al generar clave'); }
        finally { setLoading(false); }
    };

    const handlePromote = async (userId, newRole) => {
        if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;
        const token = localStorage.getItem('token');
        try {
            const res = await fetch('/api/roles/designate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ userId, newRole })
            });
            if (res.ok) {
                showMsg('success', 'Rol actualizado');

                // Check if we changed our own role
                if (userId === user.id) {
                    showMsg('success', 'Tu rol ha cambiado. Cerrando sesión para actualizar permisos...');
                    setTimeout(() => {
                        handleLogout();
                    }, 2000);
                } else {
                    fetchUsers();
                }
            }
        } catch (e) { console.error(e); }
    };

    const handleDeleteUser = async (userId) => {
        if (!confirm('¿ESTÁS SEGURO? Esta acción eliminará permanentemente al usuario y sus datos asociados.')) return;

        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`/api/roles/delete?id=${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                showMsg('success', 'Usuario eliminado');
                fetchUsers();
            } else {
                showMsg('error', data.error);
            }
        } catch (e) { console.error(e); }
    };

    const CopyButton = ({ text }) => {
        const [copied, setCopied] = useState(false);
        return (
            <button
                onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title="Copiar"
            >
                {copied ? <IconCheck /> : <IconCopy />}
            </button>
        )
    }

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#0a0319] text-gray-200 font-sans pb-12 relative">
            <ParallaxBackground />
            {/* Navbar */}
            <nav className="border-b border-purple-500/20 bg-[#130b24]/50 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">808</div>
                        <span className="font-bold text-white tracking-wide">STAFF PANEL</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-bold text-white">{user.email}</p>
                            <p className="text-xs text-purple-400 capitalize">{user.role}</p>
                        </div>
                        <button onClick={handleLogout} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors" title="Cerrar Sesión">
                            <IconLogOut />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="container mx-auto px-4 py-8">
                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-800 pb-1">
                    <button onClick={() => setActiveTab('events')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'events' ? 'bg-[#1e1b4b] text-purple-300 border-b-2 border-purple-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <IconPlus className="w-4 h-4" /> Eventos
                    </button>
                    <button onClick={() => setActiveTab('streamers')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'streamers' ? 'bg-[#1e1b4b] text-purple-300 border-b-2 border-purple-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                        <IconVideo className="w-4 h-4" /> Streamers
                    </button>
                    {['director', 'owner'].includes(user.role) && (
                        <button onClick={() => setActiveTab('audit')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'audit' ? 'bg-[#1e1b4b] text-purple-300 border-b-2 border-purple-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <IconActivity className="w-4 h-4" /> Auditoría
                        </button>
                    )}
                    {['director', 'owner'].includes(user.role) && (
                        <button onClick={() => setActiveTab('keys')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'keys' ? 'bg-[#1e1b4b] text-purple-300 border-b-2 border-purple-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <IconKey className="w-4 h-4" /> Claves
                        </button>
                    )}
                    {user.role === 'owner' && (
                        <button onClick={() => setActiveTab('roles')} className={`px-4 py-2 rounded-t-lg font-medium transition-colors flex items-center gap-2 ${activeTab === 'roles' ? 'bg-[#1e1b4b] text-purple-300 border-b-2 border-purple-500' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}>
                            <IconUsers className="w-4 h-4" /> Personal
                        </button>
                    )}
                </div>

                {/* Msg */}
                {msg.text && (
                    <div className={`mb-6 p-4 rounded-xl border ${msg.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-300' : 'bg-red-500/10 border-red-500/30 text-red-300'} animate-in fade-in slide-in-from-top-2`}>
                        {msg.text}
                    </div>
                )}

                {/* EVENTS TAB */}
                {activeTab === 'events' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-[#130b24] border border-gray-800 rounded-xl p-6 shadow-xl sticky top-24">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    {editingEventId ? <IconEdit className="w-5 h-5 text-purple-500" /> : <IconPlus className="w-5 h-5 text-purple-500" />}
                                    {editingEventId ? 'Editar Evento' : 'Crear Nuevo Evento'}
                                </h3>
                                <form onSubmit={handleCreateOrUpdateEvent} className="space-y-4">
                                    {/* Fields same as before */}
                                    <div>
                                        <label className="text-xs font-mono text-gray-400 block mb-1">Título</label>
                                        <input required type="text" className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                                            value={eventForm.title} onChange={e => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Ej: Torneo PvP" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-mono text-gray-400 block mb-1">Descripción</label>
                                        <textarea required rows="3" className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                                            value={eventForm.description} onChange={e => setEventForm({ ...eventForm, description: e.target.value })} placeholder="Detalles del evento..." />
                                    </div>

                                    {/* Date & Time Fields */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-mono text-gray-400 block mb-1">Fecha de inicio <span className="text-red-400">*</span></label>
                                            <input type="date" className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors [color-scheme:dark]"
                                                value={eventForm.start_date ? new Date(eventForm.start_date).toISOString().split('T')[0] : ''}
                                                onChange={e => setEventForm({ ...eventForm, start_date: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-mono text-gray-400 block mb-1">Hora de inicio <span className="text-red-400">*</span></label>
                                            <input type="time" className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors [color-scheme:dark]"
                                                value={eventForm.start_time || ''}
                                                onChange={e => setEventForm({ ...eventForm, start_time: e.target.value })} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-mono text-gray-400 block mb-1">Frecuencia del evento</label>
                                        <select className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                                            value={eventForm.recurrence} onChange={e => setEventForm({ ...eventForm, recurrence: e.target.value })}>
                                            <option value="none">No se repite</option>
                                            <option value="daily">Diario</option>
                                            <option value="weekly">Semanal</option>
                                            <option value="monthly">Mensual</option>
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-mono text-gray-400 block mb-1">Imagen URL</label>
                                            <input required type="url" className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                                                value={eventForm.image_url} onChange={e => setEventForm({ ...eventForm, image_url: e.target.value })} placeholder="https://..." />
                                        </div>
                                        <div>
                                            <label className="text-xs font-mono text-gray-400 block mb-1">Sección</label>
                                            <select className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none transition-colors"
                                                value={eventForm.section} onChange={e => setEventForm({ ...eventForm, section: e.target.value })}>
                                                <option value="main">Principal</option>
                                                <option value="minecraft">Minecraft</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {editingEventId && (
                                            <button type="button" onClick={handleCancelEdit} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all mt-2">
                                                Cancelar
                                            </button>
                                        )}
                                        <button disabled={loading} type="submit" className={`flex-1 ${editingEventId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'} text-white font-bold py-3 rounded-lg transition-all mt-2 disabled:opacity-50`}>
                                            {loading ? 'Guardando...' : (editingEventId ? 'Actualizar' : 'Publicar')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>

                        {/* List */}
                        <div className="lg:col-span-2 space-y-4">
                            <h3 className="text-xl font-bold text-white mb-4">Eventos Activos</h3>
                            {events.length === 0 ? <p className="text-gray-500 italic">No hay eventos.</p> : events.map(evt => (
                                <div key={evt.id} className={`bg-[#130b24] border rounded-xl p-4 flex gap-4 transition-all ${evt.status === 'pending' ? 'border-yellow-500/30 bg-yellow-900/10' : evt.status === 'rejected' ? 'border-red-500/30 bg-red-900/10' : evt.status === 'pending_deletion' ? 'border-red-600/40 bg-red-950/20' : 'border-gray-800 hover:border-purple-500/30'}`}>
                                    <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden relative bg-gray-900">
                                        <img src={evt.image || evt.image_url} alt={evt.title} className={`w-full h-full object-cover ${evt.status === 'rejected' || evt.status === 'pending_deletion' ? 'grayscale opacity-40' : ''}`} />
                                        <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${evt.gradient.replace('/50', '')}`}></div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold truncate pr-2 ${evt.status === 'pending_deletion' ? 'text-gray-500 line-through' : 'text-white'}`}>{evt.title}</h4>
                                                {evt.status === 'pending' && <span className="bg-yellow-500/20 text-yellow-300 text-[10px] px-2 py-0.5 rounded border border-yellow-500/30 uppercase font-bold tracking-wider">Pendiente</span>}
                                                {evt.status === 'rejected' && <span className="bg-red-500/20 text-red-300 text-[10px] px-2 py-0.5 rounded border border-red-500/30 uppercase font-bold tracking-wider">Rechazado</span>}
                                                {evt.status === 'pending_deletion' && <span className="bg-red-600/30 text-red-400 text-[10px] px-2 py-0.5 rounded border border-red-600/50 uppercase font-bold tracking-wider">Solicitud Eliminación</span>}
                                            </div>
                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${evt.section === 'minecraft' ? 'bg-green-900/50 text-green-400 border border-green-700' : 'bg-blue-900/50 text-blue-400 border border-blue-700'}`}>{evt.section}</span>
                                        </div>
                                        <p className="text-sm text-gray-400 line-clamp-2 mb-2">{evt.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            {evt.start_date && (
                                                <span className="text-[10px] text-gray-400 font-mono">
                                                    📅 {new Date(evt.start_date).toLocaleDateString()} {evt.start_time ? `• ${evt.start_time}` : ''}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 justify-center ml-2 border-l border-gray-700 pl-3">
                                        {/* Approval Controls for Director/Owner */}
                                        {['director', 'owner'].includes(user.role) && evt.status === 'pending' && (
                                            <>
                                                <button onClick={() => handleApprove(evt.id, evt.title, 'approve')} className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded transition-colors" title="Aprobar Evento">
                                                    <IconCheck />
                                                </button>
                                                <button onClick={() => handleApprove(evt.id, evt.title, 'reject')} className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded transition-colors" title="Rechazar Evento">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                                                </button>
                                                <div className="h-px bg-gray-700 my-1"></div>
                                            </>
                                        )}

                                        {/* Deletion Approval Controls for Director/Owner */}
                                        {['director', 'owner'].includes(user.role) && evt.status === 'pending_deletion' && (
                                            <>
                                                <button onClick={() => handleApprove(evt.id, evt.title, 'delete')} className="p-2 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded transition-colors" title="Aprobar Eliminación">
                                                    <IconTrash />
                                                </button>
                                                <button onClick={() => handleApprove(evt.id, evt.title, 'restore')} className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded transition-colors" title="Cancelar Eliminación">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                                                </button>
                                                <div className="h-px bg-gray-700 my-1"></div>
                                            </>
                                        )}

                                        <button onClick={() => handleEditEvent(evt)} className="p-2 text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors" title="Editar">
                                            <IconEdit />
                                        </button>
                                        <button onClick={() => handleDeleteEvent(evt.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Eliminar">
                                            <IconTrash />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STREAMERS TAB */}
                {activeTab === 'streamers' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-1">
                            <div className="bg-[#130b24] border border-gray-800 rounded-xl p-6 shadow-xl">
                                <h3 className="text-xl font-bold text-white mb-4">Agregar Streamer</h3>
                                <form onSubmit={handleAddStreamer} className="space-y-4">
                                    <div>
                                        <label className="text-xs font-mono text-gray-400 block mb-1">Canal de Twitch (Login)</label>
                                        <input required type="text" className="w-full bg-black/40 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:border-purple-500 outline-none"
                                            value={streamerForm.channel_id} onChange={e => setStreamerForm({ channel_id: e.target.value })} placeholder="Ej: MissiFussa" />
                                    </div>
                                    <button disabled={loading} type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all disabled:opacity-50">
                                        {loading ? 'Agregando...' : 'Agregar Streamer'}
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="lg:col-span-2">
                            <h3 className="text-xl font-bold text-white mb-4">Lista de Streamers (Monitor)</h3>
                            <div className="bg-[#130b24] border border-gray-800 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#0f0b1e] text-gray-400 font-mono text-xs uppercase">
                                        <tr>
                                            <th className="px-6 py-4">Streamer/Canal</th>
                                            <th className="px-6 py-4">Plataforma</th>
                                            <th className="px-6 py-4 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {streamers.length === 0 ? (
                                            <tr><td colSpan="3" className="px-6 py-8 text-center text-gray-500">No hay streamers configurados.</td></tr>
                                        ) : streamers.map(s => (
                                            <tr key={s.id || s.channel_id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-bold text-white">{s.name || s.channel_id}</td>
                                                <td className="px-6 py-4 text-purple-400 uppercase text-xs font-bold">{s.platform}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => handleDeleteStreamer(s.id)} className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded transition-colors">
                                                        <IconTrash />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* AUDIT TAB */}
                {activeTab === 'audit' && (
                    <div className="max-w-5xl mx-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Registro de Auditoría</h3>
                        <div className="bg-[#130b24] border border-gray-800 rounded-xl overflow-hidden max-h-[600px] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#0f0b1e] text-gray-400 font-mono text-xs uppercase sticky top-0 bg-[#0f0b1e] z-10">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Usuario</th>
                                        <th className="px-6 py-4">Acción</th>
                                        <th className="px-6 py-4">Detalles</th>
                                        <th className="px-6 py-4">IP</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {auditLogs.length === 0 ? (
                                        <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No hay registros recientes.</td></tr>
                                    ) : auditLogs.map(log => (
                                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-4 font-bold text-white">
                                                {log.user_email || 'Sistema'}
                                                <span className="block text-[10px] text-gray-500 font-normal uppercase">{log.user_role}</span>
                                            </td>
                                            <td className="px-6 py-4"><span className="text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded text-xs">{log.action}</span></td>
                                            <td className="px-6 py-4 text-gray-300 text-xs">
                                                {(() => {
                                                    try {
                                                        const d = JSON.parse(log.details);

                                                        // Custom formatters based on Action
                                                        switch (log.action) {
                                                            case 'CREATE_EVENT':
                                                                return <span>Creó el evento <strong className="text-white">{d.title}</strong></span>;
                                                            case 'UPDATE_EVENT':
                                                                // If "updates" is array of keys
                                                                if (Array.isArray(d.updates)) {
                                                                    const fields = d.updates.map(f => {
                                                                        const map = { title: 'título', description: 'descripción', badge: 'etiqueta', image_url: 'imagen', section: 'sección' };
                                                                        return map[f] || f;
                                                                    }).join(', ');
                                                                    return <span>Editó {fields} del evento <strong className="text-white">{d.title}</strong></span>;
                                                                }
                                                                // Legacy/other format
                                                                return <span>Actualizó el evento <strong className="text-white">{d.title || d.id}</strong></span>;
                                                            case 'DELETE_EVENT':
                                                                return <span className="text-red-300">Eliminó el evento <strong className="text-red-200">{d.title || d.id}</strong></span>;

                                                            case 'CREATE_STREAMER':
                                                                return <span>Agregó al streamer <strong className="text-white">{d.name}</strong> ({d.platform})</span>;
                                                            case 'DELETE_STREAMER':
                                                                return <span className="text-red-300">Eliminó al streamer <strong className="text-red-200">{d.name}</strong></span>;

                                                            case 'SYSTEM_INIT':
                                                                return <span className="italic text-gray-500">{d.message}</span>;

                                                            default:
                                                                // Fallback to simple KV
                                                                if (typeof d === 'object' && d !== null) {
                                                                    return (
                                                                        <div className="flex flex-col gap-1">
                                                                            {Object.entries(d).map(([k, v]) => (
                                                                                <div key={k} className="flex gap-1">
                                                                                    <span className="text-gray-500 font-mono uppercase">{k}:</span>
                                                                                    <span className="text-gray-300 truncate max-w-[200px]" title={String(v)}>{String(v)}</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    );
                                                                }
                                                                return String(d);
                                                        }
                                                    } catch (e) {
                                                        return log.details;
                                                    }
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 text-gray-600 font-mono text-xs">{log.ip_address}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* KEYS */}
                {activeTab === 'keys' && (
                    <div className="max-w-4xl mx-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Claves de Registro</h3>
                            <button onClick={handleGenerateKey} disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-all disabled:opacity-50">
                                <IconPlus className="w-4 h-4" /> Generar Nueva Clave
                            </button>
                        </div>
                        <div className="bg-[#130b24] border border-gray-800 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#0f0b1e] text-gray-400 font-mono text-xs uppercase">
                                    <tr>
                                        <th className="px-6 py-4">Clave</th>
                                        <th className="px-6 py-4">Creado Por</th>
                                        <th className="px-6 py-4">Usado Por</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4">Expiración</th>
                                        <th className="px-6 py-4 text-right">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800">
                                    {staffKeys.map(key => (
                                        <tr key={key.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-mono text-purple-300">{key.key_value.substring(0, 18)}...</td>
                                            <td className="px-6 py-4 text-gray-400">{key.created_by_email}</td>
                                            <td className="px-6 py-4 text-gray-300 font-bold">{key.used_by_email || <span className="text-gray-600 font-normal italic">-</span>}</td>
                                            <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${key.status === 'active' ? 'bg-green-500/10 text-green-400' : key.status === 'used' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>{key.status === 'active' ? 'Activa' : key.status === 'used' ? 'Usada' : 'Expirada'}</span></td>
                                            <td className="px-6 py-4 text-gray-500">{new Date(key.expires_at).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 text-right">{key.status === 'active' && <CopyButton text={key.key_value} />}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* ROLES */}
                {activeTab === 'roles' && (
                    <div className="max-w-4xl mx-auto">
                        <h3 className="text-xl font-bold text-white mb-6">Gestión de Personal</h3>
                        <div className="grid gap-4">
                            {users.map(u => (
                                <div key={u.id} className="bg-[#130b24] border border-gray-800 rounded-xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${u.role === 'owner' ? 'bg-gradient-to-tr from-yellow-600 to-orange-600 text-white shadow-lg shadow-orange-900/20' : u.role === 'director' ? 'bg-gradient-to-tr from-purple-600 to-pink-600 text-white' : 'bg-gray-800 text-gray-400'}`}>{u.email[0].toUpperCase()}</div>
                                        <div>
                                            <p className="font-bold text-white">{u.email}</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-mono uppercase ${u.role === 'owner' ? 'text-yellow-500' : u.role === 'director' ? 'text-purple-400' : 'text-gray-500'}`}>{u.role}</span>
                                                {u.verified && <IconCheck className="w-3 h-3 text-green-500" />}
                                                {u.username && <span className="text-xs text-gray-500 font-mono">(@{u.username})</span>}
                                            </div>
                                        </div>
                                    </div>
                                    {u.role !== 'owner' && (
                                        <div className="flex gap-2 items-center">
                                            {u.role === 'staff' && <button onClick={() => handlePromote(u.id, 'director')} className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-400 text-xs font-bold rounded border border-purple-500/30 transition-colors">Ascender a Director</button>}
                                            {u.role === 'director' && <button onClick={() => handlePromote(u.id, 'staff')} className="px-3 py-1 bg-gray-700/30 hover:bg-gray-700/50 text-gray-400 text-xs font-bold rounded border border-gray-600/30 transition-colors">Degradar a Staff</button>}

                                            <button onClick={() => handleDeleteUser(u.id)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors" title="Eliminar Usuario">
                                                <IconTrash />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
