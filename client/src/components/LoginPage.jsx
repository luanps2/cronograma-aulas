import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';
import { GoogleLogin } from '@react-oauth/google';
import API_BASE_URL from '../config/api';

export default function LoginPage({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(`${API_BASE_URL}/api/auth/google`, {
                credential: credentialResponse.credential
            });

            if (res.data.token) {
                localStorage.setItem('token', res.data.token);
                localStorage.setItem('user', JSON.stringify(res.data.user));
                onLogin(res.data.user, res.data.token);
            }
        } catch (err) {
            console.error('Google Login Error:', err);
            setError('Falha no login com Google. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        setError('Login com Google falhou. Tente novamente.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
            const payload = { email, password };
            if (isRegistering) payload.name = name;

            const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLogin(response.data.user, response.data.token);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleMicrosoftLogin = () => {
        alert('Login com Microsoft ainda não configurado para GIS/Graph API neste redesign.');
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F5F7FA',
            padding: '20px'
        }}>
            <div style={{
                background: 'white',
                padding: '40px',
                borderRadius: '16px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                width: '100%',
                maxWidth: '400px', // Slightly narrower for better vertical feel
                textAlign: 'center'
            }}>
                {/* 1. Logo Senac */}
                <img src="/senac-logo.png" alt="Senac" style={{ height: '50px', marginBottom: '20px' }} />

                {/* 2. Welcome Text */}
                <h2 style={{ fontSize: '22px', color: '#333', marginBottom: '5px', fontWeight: 600 }}>
                    {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
                </h2>
                <p style={{ color: '#666', fontSize: '14px', marginBottom: '30px' }}>
                    {isRegistering ? 'Preencha seus dados para começar' : 'Acesse seu painel acadêmico'}
                </p>

                {/* 3. Form */}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {isRegistering && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: '#555' }}>Nome Completo</label>
                            <input
                                type="text"
                                placeholder="Seu Nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                required
                            />
                        </div>
                    )}

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: '#555' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', fontWeight: 500, color: '#555' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '0.95rem', boxSizing: 'border-box' }}
                                required
                            />
                        </div>
                    </div>

                    {error && <div style={{ color: '#D32F2F', fontSize: '0.85rem', marginTop: '5px', background: '#FFEBEE', padding: '8px', borderRadius: '6px' }}>{error}</div>}

                    {/* 4. Submit Button */}
                    <button className="btn-primary" disabled={loading} style={{
                        padding: '12px',
                        marginTop: '10px',
                        justifyContent: 'center',
                        fontSize: '1rem',
                        fontWeight: 600,
                        backgroundColor: '#004A8D', // Senac Blue
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        transition: 'background 0.2s',
                        width: '100%'
                    }}>
                        {loading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Criar Conta' : 'Entrar'}</>}
                    </button>
                </form>

                {/* 5. Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '24px 0', color: '#BDBDBD' }}>
                    <div style={{ flex: 1, height: '1px', background: '#E0E0E0' }}></div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>OU CONTINUE COM</span>
                    <div style={{ flex: 1, height: '1px', background: '#E0E0E0' }}></div>
                </div>

                {/* 6. Social Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
                    <div style={{ width: '100%', maxWidth: '320px', display: 'flex', justifyContent: 'center' }}>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="outline"
                            size="large"
                            text="continue_with"
                            width="320"
                            locale="pt-BR"
                        />
                    </div>

                    <button
                        onClick={handleMicrosoftLogin}
                        style={{
                            justifyContent: 'center',
                            padding: '10px',
                            fontSize: '0.9rem',
                            position: 'relative',
                            background: 'white',
                            border: '1px solid #DADCE0',
                            borderRadius: '4px',
                            color: '#3C4043',
                            fontWeight: 500,
                            display: 'flex',
                            alignItems: 'center',
                            cursor: 'pointer',
                            height: '40px', // Standard Google Button height
                            width: '100%',
                            maxWidth: '320px'
                        }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 23 23" style={{ marginRight: '10px' }}>
                            <path fill="#f35325" d="M1 1h10v10H1z" />
                            <path fill="#81bc06" d="M12 1h10v10H12z" />
                            <path fill="#05a6f0" d="M1 12h10v10H1z" />
                            <path fill="#ffba08" d="M12 12h10v10H12z" />
                        </svg>
                        Continuar com Microsoft
                    </button>
                </div>

                {/* 7. Toggle Link */}
                <div style={{ marginTop: '30px', fontSize: '0.9rem', color: '#666' }}>
                    {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}
                    <button
                        onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#004A8D', fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px' }}
                    >
                        {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
}
