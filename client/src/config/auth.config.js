const authConfig = {
    google: {
        clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    }
};

export const validateAuthConfig = () => {
    if (!authConfig.google.clientId) {
        console.error('❌ Missing VITE_GOOGLE_CLIENT_ID in .env');
        return false;
    }
    return true;
};

export default authConfig;
