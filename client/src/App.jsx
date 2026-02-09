import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import SettingsView from './components/SettingsView';
import CalendarPage from './components/CalendarPage';
import Dashboard from './components/Dashboard';

const initAuthHelper = (token, storedUser) => {
    if (token && storedUser) {
        try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && parsedUser.id) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                return { isAuthenticated: true, user: parsedUser };
            }
        } catch (e) {
            console.error('Auth initialization error:', e);
        }
    }
    delete axios.defaults.headers.common['Authorization'];
    return { isAuthenticated: false, user: null };
};

function App() {
    const navigate = useNavigate();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);

    // Initialize Auth State on Mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        const storedUser = localStorage.getItem('user');
        const authState = initAuthHelper(token, storedUser);

        setIsAuthenticated(authState.isAuthenticated);
        setUser(authState.user);
        setIsAuthLoading(false);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete axios.defaults.headers.common['Authorization'];
        setIsAuthenticated(false);
        setUser(null);
        navigate('/');
    };

    // Axios Interceptor for 401/403 (Global)
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            response => response,
            error => {
                if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                    handleLogout();
                }
                return Promise.reject(error);
            }
        );
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    // Loading State
    if (isAuthLoading) {
        return (
            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-tertiary)' }}>
                <div className="animate-spin" style={{
                    width: '40px',
                    height: '40px',
                    border: '4px solid #E3F2FD',
                    borderTop: '4px solid #0277BD',
                    borderRadius: '50%',
                    marginBottom: '16px'
                }}></div>
                <div style={{ color: '#0277BD', fontWeight: 600 }}>Carregando aplicação...</div>
                <style>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    .animate-spin { animation: spin 1s linear infinite; }
                `}</style>
            </div>
        );
    }

    // Defensive: Invalid State (Auth but no User)
    if (isAuthenticated && !user) {
        handleLogout();
        return null; // Will trigger re-render
    }

    // Login State
    if (!isAuthenticated) {
        return <LoginPage onLogin={(userData, token) => {
            const authToken = token || localStorage.getItem('token');
            if (authToken) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
                if (token) localStorage.setItem('token', token);
            }

            setIsAuthenticated(true);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
        }} />;
    }

    return (
        <Layout user={user} onLogout={handleLogout} onNavigateHome={() => navigate('/')}>
            <Routes>
                <Route path="/" element={<CalendarPage user={user} onLogout={handleLogout} />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/settings" element={<SettingsView onBack={() => navigate('/')} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Layout>
    )
}

export default App
