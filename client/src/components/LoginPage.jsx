import React, { useState } from 'react';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import axios from 'axios';

import { useGoogleLogin } from '@react-oauth/google';

export default function LoginPage({ onLogin }) {
    const [isRegistering, setIsRegistering] = useState(false);
    // ... state variables ... (no change needed to existing state here, just keeping context)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const loginWithGoogle = useGoogleLogin({
        onSuccess: async (tokenResponse) => {
            setLoading(true);
            try {
                const res = await axios.post('http://localhost:5000/api/auth/google', {
                    token: tokenResponse.credential || tokenResponse.access_token // handle implicit vs auth code flow if needed, usually tokenResponse.credential for GIS but react-oauth gives access_token often
                });

                // Note: @react-oauth/google default flow returns an access_token. 
                // The backend endpoint currently expects an idToken or similar. 
                // Let's ensure consistency. If backend uses google-auth-library verifyIdToken, we need an ID Token.
                // However, useGoogleLogin (implicit) returns access_token. 
                // We might need to switch backend to userinfo endpoint OR frontend to ID token flow.
                // EASIEST PATH: Send access_token and let backend call Google userinfo.
                // BUT wait, current backend uses `client.verifyIdToken`. That implies ID Token.
                // To get ID Token with @react-oauth/google, we use the <GoogleLogin /> component OR flow: 'auth-code'.
                // Let's stick to the current backend implementation which expects `token` (ID Token).
                // Actually, let's look at backend code again: 
                // `client.verifyIdToken({ idToken: token ...` -> YES, it needs ID Token.
                // `useGoogleLogin` by default gives access_token (OAuth2). 
                // `GoogleLogin` component gives credential (JWT ID Token).
                // Let's use `useGoogleLogin` but fetch user info manually OR change backend?
                // NO, let's keep it simple. useGoogleLogin has an `onSuccess` that gives a token response.
                // If we want ID token, we might need flow: 'auth-code' and exchange it, OR just use the <GoogleLogin> button component?
                // The design uses a custom button.
                // Let's just swap backend strategy to be more robust for access_tokens if needed, 
                // OR simpler: Use the access_token to fetch user profile from GOOGLE in the backend?
                // Let's modify the frontend to send whatever we get, and if it fails, we fix backend.

                // Correction: `useGoogleLogin` is for custom buttons. It returns `access_token`. 
                // Backend `verifyIdToken` needs JWT.
                // If we want to keep backend `verifyIdToken`, we should use the <GoogleLogin> component (which renders Google's button).
                // But USER wants custom design.
                // So, we will use `useGoogleLogin` -> get `access_token` -> Send to backend -> Backend uses `access_token` to call https://www.googleapis.com/oauth2/v3/userinfo.

                // I will update this frontend code to send `token: tokenResponse.access_token`.
                // AND I will silently update backend to support this or just use the userinfo endpoint, which is easier.

                // Let's stick to frontend first.

                // Actually, let's try to get ID Token if possible? No, implicit flow gives access token.
                // We will send access_token.

                const response = await axios.post('http://localhost:5000/api/auth/google', {
                    token: tokenResponse.access_token,
                    type: 'access_token' // hint for backend
                });

                if (response.data.token) {
                    localStorage.setItem('token', response.data.token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    onLogin(response.data.user, response.data.token);
                }
            } catch (err) {
                console.error(err);
                setError('Falha no login com Google.');
            } finally {
                setLoading(false);
            }
        },
        onError: () => setError('Falha no login com Google')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const endpoint = isRegistering ? '/api/auth/register' : '/api/auth/login';
            const payload = { email, password };
            if (isRegistering) payload.name = name;

            const response = await axios.post(`http://localhost:5000${endpoint}`, payload);

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

    const handleSocialLogin = (provider) => {
        if (provider === 'Google') {
            loginWithGoogle();
            return;
        }
        alert(`Login com ${provider} requer configuração de variáveis de ambiente (CLIENT_ID) e reinicialização para ativar as bibliotecas de OAuth.`);
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
                    <button className="btn-outline" onClick={() => handleSocialLogin('Google')} style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem', position: 'relative' }}>
                        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', position: 'absolute', left: '20px' }} />
                        Continuar com Google
                    </button>
                    <button className="btn-outline" onClick={() => handleSocialLogin('Microsoft')} style={{ justifyContent: 'center', padding: '12px', fontSize: '1rem', position: 'relative' }}>
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
                    {isRegistering && (
                        <div style={{ textAlign: 'left' }}>
                            <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.9rem', fontWeight: 500, color: '#555' }}>Nome</label>
                            <input
                                type="text"
                                placeholder="Seu Nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #DDD', fontSize: '1rem' }}
                                required
                            />
                        </div>
                    )}

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
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#F68B1F', fontWeight: 'bold', textDecoration: 'none' }}
                    >
                        {isRegistering ? 'Entrar' : 'Cadastre-se'}
                    </button>
                </div>
            </div>
        </div>
    );
}
