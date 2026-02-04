import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import { GoogleOAuthProvider } from '@react-oauth/google';
import ErrorBoundary from './components/ErrorBoundary';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID_FOR_DEV";

import { ThemeProvider } from './contexts/ThemeContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <ErrorBoundary>
            <GoogleOAuthProvider clientId={clientId}>
                <ThemeProvider>
                    <App />
                </ThemeProvider>
            </GoogleOAuthProvider>
        </ErrorBoundary>
    </React.StrictMode>,
)
