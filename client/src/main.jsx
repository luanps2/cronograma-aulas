import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './index.css'

import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

if (!clientId) {
    console.error('CRITICAL: VITE_GOOGLE_CLIENT_ID is missing!');
}

import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={clientId}>
                <ThemeProvider>
                    <BrowserRouter>
                        <App />
                    </BrowserRouter>
                </ThemeProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
