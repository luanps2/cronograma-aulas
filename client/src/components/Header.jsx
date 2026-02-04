import React, { useState, useEffect } from 'react';
import { LogOut, User, Bell, Menu, X, Settings, ChevronDown, ExternalLink, Moon, Sun } from 'lucide-react';
import axios from 'axios';
import LinkManagerModal from './LinkManagerModal';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORY_ORDER = [
    'Ferramentas',
    'Documentos',
    'Links Úteis',
    'Atividades' // Merged group for simpler header
];

export default function Header({ user, onLogout, onNavigateHome }) {
    const { isDarkMode, toggleTheme } = useTheme();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [userLinks, setUserLinks] = useState([]);
    const [isLinkManagerOpen, setIsLinkManagerOpen] = useState(false);
    const [openCategory, setOpenCategory] = useState(null);

    // Simple notification mock
    const notifications = 2;

    useEffect(() => {
        fetchLinks();
    }, []);

    const fetchLinks = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/links');
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
                                                <ExternalLink size={14} color="#004587" />
                                                {link.title}
                                            </a>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}

                {/* Manage Links Button */}
                <button
                    onClick={() => setIsLinkManagerOpen(true)}
                    title="Personalizar Atalhos"
                    style={{ padding: '8px', borderRadius: '50%', color: 'var(--text-tertiary)', opacity: 0.7 }}
                    className="btn-icon"
                >
                    <Settings size={18} />
                </button>
            </div>

            {/* Right: Actions & User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className="btn-icon"
                    title={isDarkMode ? "Modo Claro" : "Modo Escuro"}
                >
                    {isDarkMode ? <Sun size={20} color="#FFB74D" /> : <Moon size={20} color="#666" />}
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
                                    width: '48px', height: '48px', // Increased Size
                                    borderRadius: '50%', objectFit: 'cover',
                                    border: '2px solid #fff', boxShadow: '0 0 0 2px #E3F2FD'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '48px', height: '48px', // Increased Size
                                borderRadius: '50%', background: '#E3F2FD', color: '#0277BD',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 'bold', border: '2px solid #fff', boxShadow: '0 0 0 2px #E3F2FD',
                                fontSize: '1.2rem'
                            }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={24} />}
                            </div>
                        )}
                        <div className="hide-mobile" style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#333' }}>{user?.name || 'Usuário'}</div>
                            <div style={{ fontSize: '0.8rem', color: '#888' }}>Professor</div>
                        </div>
                    </button>

                    {isUserMenuOpen && (
                        <div style={{
                            position: 'absolute', top: '120%', right: 0,
                            background: 'var(--bg-primary)', borderRadius: '8px',
                            boxShadow: 'var(--card-shadow)', border: '1px solid var(--border-color)',
                            width: '200px', overflow: 'hidden', zIndex: 1001
                        }}>
                            <div style={{ padding: '15px', borderBottom: '1px solid var(--border-color)' }}>
                                <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{user?.email}</div>
                            </div>
                            <button
                                onClick={onLogout}
                                style={{
                                    width: '100%', padding: '12px 15px', background: 'none', border: 'none',
                                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: '10px',
                                    color: '#D32F2F', cursor: 'pointer', transition: 'background 0.2s'
                                }}
                                className="dropdown-item"
                            >
                                <LogOut size={18} /> Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <LinkManagerModal
                isOpen={isLinkManagerOpen}
                onClose={() => {
                    setIsLinkManagerOpen(false);
                    fetchLinks(); // Refresh links on close
                }}
            />

            <style>{`
                @media (max-width: 900px) {
                    .hide-mobile { display: none !important; }
                }
                .btn-icon { background: none; border: none; cursor: pointer; padding: 10px; border-radius: 50%; transition: background 0.2s; }
                .btn-icon:hover { background: #f5f5f5; }
                .nav-link-btn:hover { background-color: #F0F7FF !important; color: #0277BD !important; }
                .dropdown-item:hover { background-color: #F5F5F5; }
            `}</style>
        </header>
    );
}
