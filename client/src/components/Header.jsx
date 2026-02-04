import React, { useState } from 'react';
import { LogOut, User, Bell, Menu, X, Settings, Calendar, GraduationCap } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function Header({ user, onLogout, onToggleSidebar, onNavigateHome }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

    // Simple notification mock
    const notifications = 2;

    return (
        <header style={{
            backgroundColor: '#ffffff',
            borderBottom: '1px solid #e0e0e0',
            padding: '0 20px',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
        }}>
            {/* Left: Logo & Branding */}
            <div
                onClick={onNavigateHome}
                style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}
                title="Ir para o Início"
            >
                <img src="/senac-logo.png" alt="Senac" style={{ height: '32px' }} />
                <div style={{ height: '24px', width: '1px', background: '#e0e0e0', display: 'none', md: 'block' }}></div>
                <h1 style={{
                    fontSize: '1rem',
                    fontWeight: 600,
                    color: '#004587',
                    margin: 0,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <span className="hide-mobile">Planejamento Acadêmico</span>
                </h1>
            </div>

            {/* Right: Actions & User */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

                {/* Notification Bell */}
                <button className="btn-icon" style={{ position: 'relative' }}>
                    <Bell size={20} color="#666" />
                    {notifications > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            background: '#EF5350',
                            color: 'white',
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            fontSize: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 'bold'
                        }}>{notifications}</span>
                    )}
                </button>

                {/* User Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                    >
                        {user?.avatar_url ? (
                            <img
                                src={user.avatar_url}
                                alt={user.name}
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    objectFit: 'cover',
                                    border: '2px solid #fff',
                                    boxShadow: '0 0 0 2px #E3F2FD'
                                }}
                            />
                        ) : (
                            <div style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: '#E3F2FD',
                                color: '#0277BD',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                border: '2px solid #fff',
                                boxShadow: '0 0 0 2px #E3F2FD'
                            }}>
                                {user?.name ? user.name.charAt(0).toUpperCase() : <User size={20} />}
                            </div>
                        )}
                        <div className="hide-mobile" style={{ textAlign: 'left' }}>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#333' }}>{user?.name || 'Usuário'}</div>

                            <div style={{ fontSize: '0.75rem', color: '#888' }}>Professor</div>
                        </div>
                    </button>

                    {isUserMenuOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '120%',
                            right: 0,
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            border: '1px solid #eee',
                            width: '200px',
                            overflow: 'hidden',
                            zIndex: 1001
                        }}>
                            <div style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                                <div style={{ fontWeight: 600, color: '#333' }}>{user?.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{user?.email}</div>
                            </div>
                            <button
                                onClick={onLogout}
                                style={{
                                    width: '100%',
                                    padding: '12px 15px',
                                    background: 'none',
                                    border: 'none',
                                    textAlign: 'left',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    color: '#D32F2F',
                                    cursor: 'pointer',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.background = '#FFEBEE'}
                                onMouseLeave={(e) => e.target.style.background = 'white'}
                            >
                                <LogOut size={18} /> Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .hide-mobile { display: none !important; }
                }
                .btn-icon { background: none; border: none; cursor: pointer; padding: 8px; border-radius: 50%; transition: background 0.2s; }
                .btn-icon:hover { background: #f5f5f5; }
            `}</style>
        </header>
    );
}
