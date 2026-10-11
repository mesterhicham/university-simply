import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle unauthorized errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const isAuthRequest = error.config?.url?.includes('/auth/login');
        const isAuthPage = window.location.pathname.includes('/auth') || window.location.pathname.includes('/login');

        if (error.response?.status === 401 && !isAuthRequest && !isAuthPage) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('admin_impersonator_token');
            localStorage.removeItem('admin_impersonator_user');
            if (window.location.pathname !== '/auth') {
                window.location.href = '/auth';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
