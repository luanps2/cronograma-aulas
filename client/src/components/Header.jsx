import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Menu, X, Settings, ChevronDown, ExternalLink, Moon, Sun, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import LinkManagerModal from './LinkManagerModal';
import ImportModal from './ImportModal'; // ADDED
import { useTheme } from '../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../config/api';

const CATEGORY_ORDER = [
    'Ferramentas',
    'Documentos',
    'Links Úteis',
    'Atividades'
];

const dropdownItemStyle = {
    width: '100%', padding: '12px 15px', background: 'none', border: 'none',
    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
    color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s',
    fontSize: '0.9rem', textDecoration: 'none'
};

export default function Header({ user, onLogout, onNavigateHome }) {
    const navigate = useNavigate();
    const { isDarkMode, toggleTheme } = useTheme();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [userLinks, setUserLinks] = useState([]);
    const [isLinkManagerOpen, setIsLinkManagerOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false); // ADDED
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
            // TIMEZONE FIX: Compare YYYY-MM-DD strings directly, no UTC conversion
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

    // Group links. Map "Atividades - X" to "Atividades"
    const groupedLinks = userLinks.reduce((acc, link) => {
        let cat = link.category;
        if (cat.startsWith('Atividades')) cat = 'Atividades';

        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(link);
        return acc;
    }, {});

    const hasLinks = Object.keys(groupedLinks).length > 0;

    return (
        <>
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                height: '64px',
                padding: '0 20px',
                backgroundColor: 'var(--bg-primary)',
                borderBottom: '1px solid var(--border-color)',
                position: 'sticky',
                top: 0,
                zIndex: 50,
                boxShadow: 'var(--card-shadow)',
                boxSizing: 'border-box',
                flexWrap: 'nowrap'
            }} className="main-header">

                {/* === LEFT SECTION: LOGO + MENU === */}
                <div className="header-left" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '32px', // Space between Logo and Menu
                    height: '100%',
                    flex: 1,
                    overflow: 'visible' // Allow dropdowns to show
                }}>

                    {/* Logo Area */}
                    <div
                        onClick={onNavigateHome}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            cursor: 'pointer',
                            flexShrink: 0,
                            marginRight: '10px'
                        }}
                        title="Ir para o Início"
                    >
                        <img src="/senac-logo.png" alt="Senac" style={{ height: '32px', display: 'block' }} />
                        <h1 style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            color: 'var(--text-secondary)',
                            margin: 0,
                            whiteSpace: 'nowrap'
                        }} className="hide-mobile">
                            Planejamento Acadêmico
                        </h1>
                    </div>

                    {/* Main Navigation Menu */}
                    <nav className="hide-mobile" style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '100%'
                    }}>
                        {/* Dashboard Link */}
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="nav-link-btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 12px',
                                borderRadius: '6px',
                                fontSize: '0.9rem',
                                fontWeight: 500,
                                color: 'var(--text-primary)',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                height: '36px'
                            }}
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
                                <div key={cat} style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center' }}>
                                    <button
                                        onClick={() => setOpenCategory(isOpen ? null : cat)}
                                        className="nav-link-btn"
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '8px 12px',
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            background: isOpen ? 'var(--bg-tertiary)' : 'transparent',
                                            border: 'none',
                                            cursor: 'pointer',
                                            whiteSpace: 'nowrap',
                                            height: '36px'
                                        }}
                                    >
                                        {cat} <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isOpen && (
                                        <>
                                            <div
                                                style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 990, cursor: 'default' }}
                                                onClick={() => setOpenCategory(null)}
                                            />
                                            <div style={{
                                                position: 'absolute',
                                                top: 'calc(100% + 4px)', // Just below the button
                                                left: 0,
                                                background: 'var(--bg-primary)',
                                                border: '1px solid var(--border-color)',
                                                borderRadius: '8px',
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                                minWidth: '220px',
                                                zIndex: 1005,
                                                padding: '6px',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '2px'
                                            }}>
                                                {links.map(link => (
                                                    <a
                                                        key={link.id}
                                                        href={link.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="dropdown-item"
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '8px',
                                                            padding: '10px 12px',
                                                            textDecoration: 'none',
                                                            color: 'var(--text-primary)',
                                                            borderRadius: '6px',
                                                            fontSize: '0.9rem',
                                                            transition: 'background 0.2s'
                                                        }}
                                                        onClick={() => setOpenCategory(null)}
                                                    >
                                                        <ExternalLink size={14} color="var(--text-secondary)" />
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


                {/* === RIGHT SECTION: ACTIONS + USER === */}
                <div className="header-right" style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexShrink: 0
                }}>
                    <button onClick={toggleTheme} className="btn-icon">
                        {isDarkMode ? <Sun size={20} color="#FFB74D" /> : <Moon size={20} color="var(--text-secondary)" />}
                    </button>

                    <div style={{ position: 'relative' }}>
                        <button onClick={() => setIsNotifOpen(!isNotifOpen)} className="btn-icon" style={{ position: 'relative' }}>
                            <Bell size={20} color={isDarkMode ? '#AAA' : '#666'} />
                            {notifications.length > 0 && (
                                <span style={{
                                    position: 'absolute', top: 0, right: 0,
                                    background: '#EF5350', color: 'white', borderRadius: '50%',
                                    width: '16px', height: '16px', fontSize: '10px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
                                }}>{notifications.length}</span>
                            )}
                        </button>

                        {isNotifOpen && (
                            <>
                                <div className="notif-overlay" onClick={() => setIsNotifOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1050 }} />
                                <div className="notif-dropdown" style={{
                                    position: 'absolute', top: '120%', right: 0,
                                    backgroundColor: 'var(--bg-primary)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '12px',
                                    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                    zIndex: 1060,
                                    width: '320px',
                                    maxHeight: '400px',
                                    overflow: 'auto'
                                }}>
                                    <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Aulas de Hoje</h4>
                                        <X size={16} style={{ cursor: 'pointer' }} onClick={() => setIsNotifOpen(false)} />
                                    </div>
                                    {notifications.length > 0 ? (
                                        <div>
                                            {notifications.map((lesson, idx) => (
                                                <div key={idx} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{lesson.period} - {lesson.uc || lesson.ucName}</div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>{lesson.turma} • {lesson.lab}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>Sem aulas hoje</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    <div style={{ position: 'relative' }}>
                        <button
                            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '10px',
                                background: 'transparent', border: 'none', cursor: 'pointer', padding: 0
                            }}
                        >
                            {user?.avatar_url ? (
                                <img src={user.avatar_url} alt="User" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--bg-secondary)' }} />
                            ) : (
                                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {user?.name?.[0] || 'U'}
                                </div>
                            )}
                            <div className="hide-mobile" style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name?.split(' ')[0]}</div>
                            </div>
                        </button>

                        {isUserMenuOpen && (
                            <>
                                <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1000 }} onClick={() => setIsUserMenuOpen(false)} />
                                <div style={{
                                    position: 'absolute', top: '120%', right: 0,
                                    background: 'var(--bg-primary)',
                                    borderRadius: '8px',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                    border: '1px solid var(--border-color)',
                                    width: '200px',
                                    zIndex: 1001,
                                    overflow: 'hidden',
                                    padding: '5px'
                                }}>
                                    <button onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }} className="dropdown-item" style={dropdownItemStyle}><Settings size={16} /> Configurações</button>
                                    <button onClick={() => { setIsUserMenuOpen(false); setIsImportModalOpen(true); }} className="dropdown-item" style={dropdownItemStyle}><span style={{ fontSize: '1rem' }}>📥</span> Importar</button>
                                    <div style={{ height: '1px', background: 'var(--border-color)', margin: '4px 0' }} />
                                    <button onClick={onLogout} className="dropdown-item" style={{ ...dropdownItemStyle, color: '#D32F2F' }}><LogOut size={16} /> Sair</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <style>{`
                    .main-header { box-sizing: border-box; }
                    .nav-link-btn:hover { background-color: var(--bg-secondary) !important; }
                    .dropdown-item:hover { background-color: var(--bg-secondary) !important; }
                    
                    @media (max-width: 900px) {
                        .hide-mobile { display: none !important; }
                    }
                    @media (max-width: 640px) {
                        .main-header { padding: 0 16px !important; }
                    }
                `}</style>
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
        </>
    );

}
