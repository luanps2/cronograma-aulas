import React from 'react';
import Header from './Header';

export default function Layout({ children, user, onLogout, onNavigateHome }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
            <Header user={user} onLogout={onLogout} onNavigateHome={onNavigateHome} />
            <main style={{ flex: 1, padding: '20px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                {children}
            </main>
        </div>
    );
}
