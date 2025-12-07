import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

// Simple Loader Component if not exported elsewhere
const Loader = () => (
    <div className="min-h-screen bg-[#0a0319] flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin text-purple-500"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
    </div>
);

export default function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const location = useLocation();

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');

            if (!token) {
                setIsAuthenticated(false);
                return;
            }

            try {
                const res = await fetch('/api/auth/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    // Update user info in local storage in case it changed
                    localStorage.setItem('user', JSON.stringify(data.user));
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    setIsAuthenticated(false);
                }
            } catch (error) {
                console.error("Auth check failed", error);
                setIsAuthenticated(false);
            }
        };

        checkAuth();
    }, [location.pathname]); // Re-check on route change if needed, though mostly one-time is enough

    if (isAuthenticated === null) {
        return <Loader />;
    }

    if (!isAuthenticated) {
        return <Navigate to="/staff" state={{ from: location }} replace />;
    }

    return children;
}
