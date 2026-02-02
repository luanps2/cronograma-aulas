import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

export default function LoginPage({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
            const response = await axios.post(`http://localhost:5000${endpoint}`, { email, password });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
                onLogin(response.data.user);
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.error || 'Ocorreu um erro. Tente novamente.');
        } finally {
            setLoading(false);
        }
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
                maxWidth: '450px',
                textAlign: 'center'
            }}>
                <div style={{ marginBottom: '30px' }}>
                    <img src="/senac-logo.png" alt="Senac" style={{ height: '60px', marginBottom: '20px' }} />
                    <h2 style={{ fontSize: '24px', color: '#333' }}>
                        {isRegistering ? 'Crie sua conta' : 'Bem-vindo de volta'}
                    </h2>
                    <p style={{ color: '#666', marginTop: '8px' }}>
                        {isRegistering ? 'Cadastre-se para gerenciar suas aulas' : 'Acesse seu planejamento acadêmico'}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
                    <button className="btn-outline" onClick={onLogin} style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem', position: 'relative' }}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', position: 'absolute', left: '20px' }} />
                        Continuar com Google
                    </button>
                    <button className="btn-outline" onClick={onLogin} style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem', position: 'relative' }}>
                        <img src="https://www.svgrepo.com/show/452269/microsoft.svg" alt="Microsoft" style={{ width: '20px', position: 'absolute', left: '20px' }} />
                        Continuar com Microsoft
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '20px 0', color: '#999' }}>
                    <div style={{ flex: 1, height: '1px', background: '#EEE' }}></div>
                    <span style={{ fontSize: '0.85rem' }}>OU</span>
                    <div style={{ flex: 1, height: '1px', background: '#EEE' }}></div>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#555' }}>Email</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '1rem' }}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#555' }}>Senha</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} color="#999" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '1rem' }}
                                required
                            />
                        </div>
                    </div>

                    {error && <div style={{ color: 'red', fontSize: '0.9rem', marginTop: '5px' }}>{error}</div>}

                    <button className="btn-primary" disabled={loading} style={{ padding: '12px', marginTop: '10px', justifyContent: 'center', fontSize: '1rem' }}>
                        {loading ? <Loader2 className="animate-spin" /> : <>{isRegistering ? 'Cadastrar' : 'Entrar'} <ArrowRight size={18} /></>}
                    </button>
                </form>

                <div style={{ marginTop: '20px', fontSize: '0.9rem', color: '#666' }}>
                    {isRegistering ? 'Já tem uma conta?' : 'Não tem uma conta?'}{' '}
                    <button
                        onClick={() => setIsRegistering(!isRegistering)}
                        style={{ color: '#F68B1F', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                        {isRegistering ? 'Entrar' : 'Cadastre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
}
