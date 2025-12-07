import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ParallaxBackground from './components/ParallaxBackground';

// Icons
const IconLock = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
const IconMail = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const IconKey = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="7.5" cy="15.5" r="5.5" /><path d="m21 2-9.6 9.6" /><path d="m15.5 7.5 3 3L22 7l-3-3" /></svg>;
const IconArrowRight = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>;
const IconLoader = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
const IconCheckCheck = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 7 17l-5-5" /><path d="m22 10-7.5 7.5L13 16" /></svg>;
const IconUser = (props) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;

export default function Staff() {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Verification states
    const [verifying, setVerifying] = useState(false);
    const [verificationStatus, setVerificationStatus] = useState(null); // 'success', 'error'

    const navigate = useNavigate();
    const location = useLocation();

    // Form states
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        password: '',
        staffKey: ''
    });

    // Check for verification token in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const token = params.get('token');

        if (token) {
            verifyEmail(token);
        }
    }, [location]);

    // Check if already logged in
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            // verify token validity with /api/auth/me usually, but for now simple redirect
            // Ideally we check if token is valid before redirecting or let Dashboard handle it
            navigate('/staff/dashboard');
        }
    }, [navigate]);

    const verifyEmail = async (token) => {
        setVerifying(true);
        try {
            const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
            const data = await res.json();

            if (res.ok) {
                setVerificationStatus('success');
                setSuccess(data.message);
                // Clear query params
                window.history.replaceState({}, document.title, window.location.pathname);
            } else {
                setVerificationStatus('error');
                setError(data.error);
            }
        } catch (err) {
            setVerificationStatus('error');
            setError('Error de conexión al verificar email');
        } finally {
            setVerifying(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError(null);
    };

    // Needs verification state
    const [needsVerification, setNeedsVerification] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);
        setNeedsVerification(false);

        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) {
                if (data.needsVerification) {
                    setNeedsVerification(true);
                }
                throw new Error(data.error || 'Ocurrió un error');
            }

            if (isLogin) {
                // Login success
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                navigate('/staff/dashboard');
            } else {
                // Registration success
                setSuccess(data.message);
                setFormData({ email: '', password: '', staffKey: '' });
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email })
            });
            const data = await res.json();

            if (res.ok) {
                setSuccess(data.message);
                setNeedsVerification(false);
            } else {
                setError(data.error || 'Error al reenviar');
            }
        } catch (err) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    // Render Verification View
    if (verifying || verificationStatus) {
        return (
            <div className="min-h-screen bg-[#0a0319] text-white font-sans flex items-center justify-center p-4">
                <ParallaxBackground />
                <div className="w-full max-w-md bg-[#130b24]/90 backdrop-blur-xl border border-purple-500/30 p-8 rounded-2xl shadow-2xl relative z-10 text-center">
                    {verifying ? (
                        <div className="flex flex-col items-center gap-4">
                            <IconLoader className="w-12 h-12 text-purple-500 animate-spin" />
                            <h2 className="text-2xl font-bold">Verificando Email...</h2>
                        </div>
                    ) : verificationStatus === 'success' ? (
                        <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                            <IconCheckCheck />
                            <h2 className="text-2xl font-bold text-green-400">¡Email Verificado!</h2>
                            <p className="text-gray-300 mb-6">{success}</p>
                            <button
                                onClick={() => { setVerificationStatus(null); setIsLogin(true); }}
                                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Iniciar Sesión
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-red-500 text-5xl">✕</div>
                            <h2 className="text-2xl font-bold text-red-500">Error de Verificación</h2>
                            <p className="text-gray-300 mb-6">{error}</p>
                            <button
                                onClick={() => { setVerificationStatus(null); navigate('/staff'); }}
                                className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg transition-all"
                            >
                                Volver
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0319] text-white font-sans flex items-center justify-center p-4 relative overflow-hidden">
            <ParallaxBackground />

            {/* Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="w-full max-w-md bg-[#130b24]/80 backdrop-blur-xl border border-purple-500/30 p-8 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.15)] relative z-10 transition-all duration-500">

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl mb-4 shadow-lg shadow-purple-500/30">
                        <span className="font-mono font-bold text-2xl">808</span>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Staff Portal</h1>
                    <p className="text-gray-400 text-sm">
                        {isLogin
                            ? 'Accede al panel de administración de eventos y comunidad.'
                            : 'Únete al equipo de staff. Requiere clave de acceso.'}
                    </p>
                </div>

                {/* Success/Error Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-xl text-red-200 text-sm flex flex-col gap-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0"><circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" /><line x1="12" x2="12.01" y1="16" y2="16" /></svg>
                            <span>{error}</span>
                        </div>
                        {needsVerification && (
                            <button
                                onClick={handleResendVerification}
                                disabled={loading}
                                className="ml-7 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-100 py-1.5 px-3 rounded transition-colors w-fit border border-red-500/30"
                            >
                                {loading ? 'Enviando...' : 'Reenviar Email de Verificación'}
                            </button>
                        )}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-4 bg-green-500/10 border border-green-500/50 rounded-xl text-green-200 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                        <IconCheckCheck className="w-5 h-5 shrink-0" />
                        {success}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">

                    {/* Username Input (Register Only) */}
                    {!isLogin && (
                        <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider ml-1">Usuario</label>
                            <div className="relative">
                                <IconUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                                <input
                                    type="text"
                                    name="username"
                                    required
                                    minLength={3}
                                    maxLength={20}
                                    value={formData.username || ''}
                                    onChange={handleChange}
                                    placeholder="usuario_123"
                                    className="w-full bg-[#0a0319] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Email/Identifier Input */}
                    <div className="group">
                        <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider ml-1">
                            {isLogin ? 'Email o Usuario' : 'Email'}
                        </label>
                        <div className="relative">
                            <IconMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                            <input
                                type={isLogin ? "text" : "email"}
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                placeholder={isLogin ? "tu@email.com o usuario" : "tu@email.com"}
                                className="w-full bg-[#0a0319] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="group">
                        <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider ml-1">Contraseña</label>
                        <div className="relative">
                            <IconLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                            <input
                                type="password"
                                name="password"
                                required
                                minLength={8}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full bg-[#0a0319] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Staff Key (Register only) */}
                    {!isLogin && (
                        <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="block text-xs font-mono text-purple-300 mb-1.5 uppercase tracking-wider ml-1">Staff Key</label>
                            <div className="relative">
                                <IconKey className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-purple-400 transition-colors pointer-events-none" />
                                <input
                                    type="text"
                                    name="staffKey"
                                    required
                                    value={formData.staffKey}
                                    onChange={handleChange}
                                    placeholder="Clave proporcionada por Owner/Director"
                                    className="w-full bg-[#0a0319] border border-gray-700 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner font-mono text-sm"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-900/20 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
                    >
                        {loading ? <IconLoader /> : (
                            <>
                                {isLogin ? 'INICIAR SESIÓN' : 'REGISTRARSE'}
                                {!loading && <IconArrowRight className="w-5 h-5" />}
                            </>
                        )}
                    </button>
                </form>

                {/* Toggle Login/Register */}
                <div className="mt-8 text-center">
                    <p className="text-gray-400 text-sm">
                        {isLogin ? '¿Nuevo en el Staff?' : '¿Ya tienes cuenta?'}
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccess(null);
                                setFormData({ email: '', username: '', password: '', staffKey: '' });
                            }}
                            className="ml-2 text-purple-400 hover:text-purple-300 font-bold hover:underline transition-colors"
                        >
                            {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
                        </button>
                    </p>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <a href="/" className="text-xs text-gray-500 hover:text-gray-400 transition-colors flex items-center justify-center gap-1">
                        ← Volver al inicio
                    </a>
                </div>
            </div>
        </div>
    );
}
