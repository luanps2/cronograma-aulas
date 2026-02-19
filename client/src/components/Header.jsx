import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Menu, X, Settings, ChevronDown, ExternalLink, Moon, Sun, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import API_BASE_URL from '../config/api';
import LinkManagerModal from './LinkManagerModal';
import ImportModal from './ImportModal';

const CATEGORY_ORDER = [
    'Ferramentas',
    'Documentos',
    'Links Úteis',
    'Atividades'
];

export default function Header({ user, onLogout, onNavigateHome }) {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [userLinks, setUserLinks] = useState([]);
    const [isLinkManagerOpen, setIsLinkManagerOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [openCategory, setOpenCategory] = useState(null);

    // Real notifications
    const [notifications, setNotifications] = useState([]);
    const [isNotifOpen, setIsNotifOpen] = useState(false);

    useEffect(() => {
        fetchLinks();
        fetchTodayNotifications();
    }, []);

    const fetchTodayNotifications = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/lessons`);
            const allLessons = res.data || [];
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
            const todayLessons = allLessons.filter(lesson => {
                if (!lesson.date) return false;
                const lessonDate = String(lesson.date).split('T')[0];
                return lessonDate === todayStr;
            });
            setNotifications(todayLessons);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchLinks = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/links`);
            setUserLinks(res.data);
        } catch (error) {
            console.error('Error fetching header links', error);
        }
    };

    const groupedLinks = userLinks.reduce((acc, link) => {
        let cat = link.category;
        if (cat.startsWith('Atividades')) cat = 'Atividades';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(link);
        return acc;
    }, {});

    return (
        <>
            <header className="header">
                {/* --- HEADER LEFT --- */}
                <div className="header-left">
                    {/* Logo Section */}
                    <div className="logo-section" onClick={onNavigateHome} title="Ir para o Início">
                        <img src="/senac-logo.png" alt="Senac" className="header-logo" />
                        <h1 className="header-title hide-mobile">Planejamento Acadêmico</h1>
                    </div>

                    {/* Main Navbar */}
                    <nav className="header-nav hide-mobile">
                        {/* Dashboard Link */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="nav-link-btn"
                        >
                            <LayoutGrid size={18} />
                            Dashboard
                        </button>

                        {/* Category Dropdowns */}
                        {CATEGORY_ORDER.map(cat => {
                            const links = groupedLinks[cat];
                            if (!links || links.length === 0) return null;
                            const isOpen = openCategory === cat;

                            return (
                                <div key={cat} className="nav-dropdown-container">
                                    <button
                                        onClick={() => setOpenCategory(isOpen ? null : cat)}
                                        className={`nav-link-btn ${isOpen ? 'active' : ''}`}
                                    >
                                        {cat}
                                        <ChevronDown size={14} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
                                    </button>

                                    {/* Dropdown Content */}
                                    {isOpen && (
                                        <>
                                            <div className="dropdown-overlay" onClick={() => setOpenCategory(null)} />
                                            <div className="dropdown-menu">
                                                {links.map(link => (
                                                    <a
                                                        key={link.id}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="dropdown-item"
                                                        onClick={() => setOpenCategory(null)}
                                                    >
                                                        <ExternalLink size={14} className="icon-subtle" />
                                                        {link.title}
                                                    </a>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </nav>
                </div>

                {/* --- HEADER RIGHT --- */}
                <div className="header-right">
                    {/* Theme Toggle */}
                    <button onClick={toggleTheme} className="header-icon-btn" title="Alternar Tema">
                        {isDarkMode ? <Sun size={20} color="#FFB74D" /> : <Moon size={20} className="icon-subtle" />}
                    </button>

                    {/* Notifications */}
                    <div className="nav-dropdown-container">
                        <button
                            onClick={() => setIsNotifOpen(!isNotifOpen)}
                            className={`header-icon-btn ${isNotifOpen ? 'active' : ''}`}
                            title="Notificações"
                        >
                            <Bell size={20} className="icon-subtle" />
                            {notifications.length > 0 && (
                                <span className="notification-badge">{notifications.length}</span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <>
                                <div className="dropdown-overlay" onClick={() => setIsNotifOpen(false)} />
                                <div className="dropdown-menu notification-dropdown">
                                    <div className="dropdown-header">
                                        <h4>Aulas de Hoje</h4>
                                        <button className="close-btn" onClick={() => setIsNotifOpen(false)}>
                                            <X size={16} />
                                        </button>
                                    </div>
                                    <div className="notification-list">
                                        {notifications.length > 0 ? (
                                            notifications.map((lesson, idx) => (
                                                <div key={idx} className="notification-item">
                                                    <div className="notif-title">{lesson.period} - {lesson.uc || lesson.ucName}</div>
                                                    <div className="notif-subtitle">{lesson.turma} • {lesson.lab}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="empty-state">Sem aulas hoje</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* User Avatar */}
                    <div className="nav-dropdown-container">
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            className="user-profile-btn"
                        >
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="User" className="user-avatar" />
                            ) : (
                                <div className="user-avatar-placeholder">
                                    {user?.name?.[0] || 'U'}
                                </div>
                            )}
                            <div className="user-name hide-mobile">
                                {user?.name?.split(' ')[0]}
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div className="dropdown-overlay" onClick={() => setIsUserMenuOpen(false)} />
                                <div className="dropdown-menu user-dropdown">
                                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }} className="dropdown-item">
                                        <Settings size={16} /> Configurações
                                    </button>
                                    <button onClick={() => { setIsUserMenuOpen(false); setIsImportModalOpen(true); }} className="dropdown-item">
                                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>📥</span> Importar
                                    </button>
                                    <div className="dropdown-divider" />
                                    <button onClick={onLogout} className="dropdown-item danger">
                                        <LogOut size={16} /> Sair
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Modals */}
            <LinkManagerModal
                isOpen={isLinkManagerOpen}
                onClose={() => {
                    setIsLinkManagerOpen(false);
                    fetchLinks();
                }}
            />

            <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onImportSuccess={() => {
                    window.dispatchEvent(new Event('lessons-updated'));
                }}
            />

            <style>{`
                /* --- Parte 1: CSS Obrigatório --- */
                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    width: 100%;
                    height: 64px;
                    flex-wrap: nowrap;
                    padding: 0 20px;
                    background-color: var(--bg-primary);
                    border-bottom: 1px solid var(--border-color);
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.02);
                    box-sizing: border-box;
                }

                .header-left,
                .header-right {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    flex-wrap: nowrap;
                }

                /* --- Parte 2: Ajustes de Logo e Title --- */
                .logo-section {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    cursor: pointer;
                    flex-shrink: 0;
                }

                .header-logo {
                    height: 32px;
                    display: block;
                }

                .header-title {
                    font-size: 1rem;
                    fontWeight: 600;
                    color: var(--text-secondary);
                    margin: 0;
                    white-space: nowrap;
                }

                /* --- Parte 3: Navbar --- */
                .header-nav {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    height: 100%;
                }

                .nav-link-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 12px;
                    border-radius: 6px;
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    white-space: nowrap;
                    height: 36px;
                    transition: background 0.2s;
                }

                .nav-link-btn:hover,
                .nav-link-btn.active {
                    background-color: var(--bg-secondary);
                    color: var(--text-secondary);
                }

                /* --- Parte 4: Dropdowns --- */
                .nav-dropdown-container {
                    position: relative;
                    height: 100%;
                    display: flex;
                    align-items: center;
                }

                .dropdown-arrow {
                    transition: transform 0.2s;
                }
                .dropdown-arrow.open {
                    transform: rotate(180deg);
                }

                .dropdown-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    z-index: 990;
                    cursor: default;
                }

                .dropdown-menu {
                    position: absolute;
                    top: calc(100% + 8px);
                    left: 0; /* Aligned left by default */
                    background: var(--bg-primary);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    min-width: 220px;
                    z-index: 1005;
                    padding: 6px;
                    display: flex;
                    flex-direction: column;
                    gap: 2px;
                    animation: fadeIn 0.1s ease-out;
                }

                /* Right-aligned dropdowns for header-right items */
                .header-right .dropdown-menu {
                    left: auto;
                    right: 0;
                }

                .dropdown-item {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 12px;
                    text-decoration: none;
                    color: var(--text-primary);
                    border-radius: 6px;
                    font-size: 0.9rem;
                    transition: background 0.2s;
                    background: none;
                    border: none;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                }

                .dropdown-item:hover {
                    background-color: var(--bg-secondary);
                }

                .dropdown-item.danger {
                    color: #D32F2F;
                }
                .dropdown-item.danger:hover {
                    background-color: #FFEBEE;
                }

                .dropdown-divider {
                    height: 1px;
                    background: var(--border-color);
                    margin: 4px 0;
                }

                /* --- Parte 5: Ícones (Correção do Fundo Cinza) --- */
                .header-icon-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%; /* Opcional: circular */
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    color: var(--text-primary);
                    transition: background 0.2s;
                    position: relative;
                    padding: 0; /* Reset default padding */
                }

                .header-icon-btn:hover,
                .header-icon-btn.active {
                    background-color: var(--bg-secondary);
                }

                .icon-subtle {
                    color: var(--text-tertiary);
                }

                .notification-badge {
                    position: absolute;
                    top: 2px;
                    right: 2px;
                    background: #EF5350;
                    color: white;
                    border-radius: 50%;
                    width: 16px;
                    height: 16px;
                    font-size: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    border: 2px solid var(--bg-primary);
                }

                /* --- Parte 6: User Profile --- */
                .user-profile-btn {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    background: transparent;
                    border: none;
                    cursor: pointer;
                    padding: 4px 8px;
                    border-radius: 20px;
                    transition: background 0.2s;
                }

                .user-profile-btn:hover {
                    background-color: var(--bg-secondary);
                }

                .user-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid var(--border-color);
                }

                .user-avatar-placeholder {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    background: var(--bg-secondary);
                    color: var(--text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 0.9rem;
                }

                .user-name {
                    font-size: 0.9rem;
                    font-weight: 500;
                    color: var(--text-primary);
                }

                /* Notification Dropdown Specifics */
                .notification-dropdown {
                    width: 320px;
                    padding: 0;
                    overflow: hidden;
                }

                .dropdown-header {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: var(--bg-tertiary);
                }

                .dropdown-header h4 {
                    margin: 0;
                    font-size: 0.95rem;
                }

                .close-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    color: var(--text-tertiary);
                    display: flex;
                    align-items: center;
                }

                .notification-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .notification-item {
                    padding: 12px 16px;
                    border-bottom: 1px solid var(--border-color);
                    transition: background 0.2s;
                }

                .notification-item:last-child {
                    border-bottom: none;
                }
                
                .notification-item:hover {
                    background-color: var(--bg-tertiary);
                }

                .notif-title {
                    font-weight: 600;
                    font-size: 0.9rem;
                    margin-bottom: 2px;
                }

                .notif-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-tertiary);
                }

                .empty-state {
                    padding: 24px;
                    text-align: center;
                    color: var(--text-tertiary);
                    font-size: 0.9rem;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Mobile Optimization */
                @media (max-width: 900px) {
                    .hide-mobile { display: none !important; }
                    .header { justify-content: space-between; }
                }
                
                @media (max-width: 640px) {
                    .header { padding: 0 12px; }
                    .header-left, .header-right { gap: 12px; }
                }
            `}</style>
        </>
    );
}
