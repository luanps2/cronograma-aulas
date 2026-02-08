import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Menu, X, Settings, ChevronDown, ExternalLink, Moon, Sun, LayoutGrid } from 'lucide-react';
import axios from 'axios';
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

    // Simple notification mock
    const notifications = 2;

    useEffect(() => {
        fetchLinks();
    }, []);

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
        <header style={{
            backgroundColor: 'var(--bg-primary)',
            borderBottom: '1px solid var(--border-color)',
            padding: '0 20px',
            height: '80px', // Increased height for bigger elements
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: 'var(--card-shadow)'
        }}>
            {/* Left: Logo & Branding */}
            <div
                onClick={onNavigateHome}
                style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer', marginRight: '20px' }}
                title="Ir para o Início"
            >
                <img src="/senac-logo.png" alt="Senac" style={{ height: '48px' }} /> {/* Increased Size */}
                <div style={{ height: '32px', width: '1px', background: 'var(--border-color)', display: 'none', md: 'block' }}></div>
                <h1 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    margin: 0,
                    alignItems: 'center',
                    gap: '8px'
                }} className="hide-mobile">
                    Planejamento Acadêmico
                </h1>
            </div>

            {/* Center: Dynamic Links */}
            <div className="header-links-area hide-mobile" style={{ flex: 1, display: 'flex', gap: '5px', justifyContent: 'center' }}>
                {CATEGORY_ORDER.map(cat => {
                    const links = groupedLinks[cat];
                    if (!links || links.length === 0) return null;

                    const isOpen = openCategory === cat;

                    return (
                        <div key={cat} style={{ position: 'relative' }}>
                            <button
                                onClick={() => setOpenCategory(isOpen ? null : cat)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 12px', borderRadius: '6px',
                                    fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)',
                                    backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'transparent',
                                    transition: '0.2s'
                                }}
                                className="nav-link-btn"
                            >
                                {cat} <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
                            </button>

                            {isOpen && (
                                <>
                                    <div
                                        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 990 }}
                                        onClick={() => setOpenCategory(null)}
                                    />
                                    <div style={{
                                        position: 'absolute', top: '120%', left: 0,
                                        background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
                                        borderRadius: '8px', boxShadow: 'var(--card-shadow)',
                                        minWidth: '200px', zIndex: 1005, padding: '5px',
                                        display: 'flex', flexDirection: 'column', gap: '2px'
                                    }}>
                                        {links.map(link => (
                                            <a
                                                key={link.id} href={link.url} target="_blank" rel="noopener noreferrer"
                                                className="dropdown-item"
                                                style={{
                                                    display: 'flex', alignItems: 'center', gap: '8px',
                                                    padding: '10px', textDecoration: 'none', color: 'var(--text-primary)',
                                                    borderRadius: '6px', fontSize: '0.9rem'
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

                {/* Removed Dashboard and Settings buttons from here as they are now in the User Menu */}
            </div>

            {/* Right: Actions & User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="btn-icon"
                    title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                >
                    {isDarkMode ? <Sun size={20} color="#FFB74D" /> : <Moon size={20} color="var(--text-secondary)" />}
                </button>

                {/* Notification Bell */}
                <button className="btn-icon" style={{ position: 'relative' }}>
                    <Bell size={20} color={isDarkMode ? '#AAA' : '#666'} />
                    {notifications > 0 && (
                        <span style={{
                            position: 'absolute', top: -2, right: -2,
                            background: '#EF5350', color: 'white', borderRadius: '50%',
                            width: '18px', height: '18px', fontSize: '11px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold',
                            border: '2px solid white'
                        }}>{notifications}</span>
                    )}
                </button>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px',
                            background: 'none', border: 'none', cursor: 'pointer', outline: 'none'
                        }}
                    >
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                style={{
                                    width: '48px', height: '48px',
                                    borderRadius: '50%', objectFit: 'cover',
                                    border: '2px solid #fff', boxShadow: '0 0 0 2px #E3F2FD'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '48px', height: '48px',
                                borderRadius: '50%', background: '#E3F2FD', color: '#0277BD',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 0 0 2px #E3F2FD',
                                fontSize: '1.2rem'
                            }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={24} />}
                            </div>
                        )}
                        <div className="hide-mobile" style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name || 'Usuário'}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>Professor</div>
                        </div>
                    </button>

                    {isUserMenuOpen && (
                        <div style={{
                            position: 'absolute', top: '120%', right: 0,
                            background: 'var(--bg-primary)', borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)',
                            width: '220px', overflow: 'hidden', zIndex: 1001
                        }}>
                            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.email}</div>
                            </div>

                            <button onClick={() => { setIsUserMenuOpen(false); navigate('/dashboard'); }} className="dropdown-item" style={dropdownItemStyle}>
                                <LayoutGrid size={16} /> Dashboard
                            </button>
                            <button onClick={() => { setIsUserMenuOpen(false); navigate('/settings'); }} className="dropdown-item" style={dropdownItemStyle}>
                                <Settings size={16} /> Configurações
                            </button>
                            <button onClick={() => { setIsUserMenuOpen(false); navigate('/monthly-totals'); }} className="dropdown-item" style={dropdownItemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '1.1rem' }}>📊</span> Total de Aulas (Mês)
                                </div>
                            </button>
                            <button onClick={() => { setIsUserMenuOpen(false); setIsImportModalOpen(true); }} className="dropdown-item" style={dropdownItemStyle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2E7D32' }}>
                                    <span style={{ fontSize: '1.1rem' }}>📥</span> Importar Planilha
                                </div>
                            </button>

                            <div style={{ height: '1px', background: 'var(--border-color)', margin: '5px 0' }}></div>

                            <button
                                onClick={onLogout}
                                style={{ ...dropdownItemStyle, color: '#D32F2F' }}
                                className="dropdown-item"
                            >
                                <LogOut size={16} /> Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                    // Dispatch global event for CalendarPage to refresh
                    window.dispatchEvent(new Event('lessons-updated'));
                    // Also refresh header links if needed, though unlikely affected immediately
                }}
            />

            <style>{`
                @media (max-width: 900px) {
                    .hide-mobile { display: none !important; }
                }
                .btn-icon { background: none; border: none; cursor: pointer; padding: 10px; border-radius: 50%; transition: background 0.2s; }
                .btn-icon:hover { background: var(--bg-secondary); }
                .nav-link-btn:hover { background-color: var(--bg-secondary) !important; color: var(--text-primary) !important; }
                .dropdown-item:hover { background-color: var(--bg-secondary); }
            `}</style>
        </header>
    );
}
