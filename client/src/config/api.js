
// Centralized API Configuration
// This ensures that the app uses the environment variable in production
// and falls back to localhost in development.

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Helper to ensure no double slashes if the env var has a trailing slash
export const getApiUrl = (endpoint) => {
    const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${base}${path}`;
};

export default API_BASE_URL;
