import axios from 'axios';

// Migrated stack (FastAPI) default:
// - Backend: http://localhost:5002
// You can override via Vite env: VITE_API_BASE_URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const backendDetail = error.response?.data?.detail;
        const backendMessage = error.response?.data?.message;
        const message = backendDetail || backendMessage || error.message || 'API request failed';
        return Promise.reject(new Error(message));
    }
);

export const setAuthToken = (token) => {
    if (token) {
        localStorage.setItem('authToken', token);
    } else {
        localStorage.removeItem('authToken');
    }
};

export const getAuthToken = () => localStorage.getItem('authToken');

export const authAPI = {
    login: async (email, password) => {
        const data = await api.post('/auth/login', { email, password });
        // FastAPI returns { access_token, token_type }
        setAuthToken(data.access_token);
        const user = await api.get('/auth/me');
        return { token: data.access_token, user };
    },
    register: async (userData) => {
        // Register returns user; then login to obtain token
        await api.post('/auth/register', userData);
        return await authAPI.login(userData.email, userData.password);
    },
    getCurrentUser: () => api.get('/auth/me'),
    logout: () => {
        setAuthToken(null);
        localStorage.removeItem('currentUser');
    },
};

export const scanAPI = {
    scan: (token, gate_id) => api.post('/scan', { token, gate_id }),
    history: (passId) => api.get(`/scan/history/${passId}`),
};

export const locationAPI = {
    send: (payload) => api.post('/location', payload),
    latest: (passId) => api.get(`/location/latest/${passId}`),
};

export const studentAPI = {
    getProfile: () => api.get('/students/profile'),
    updateProfile: (profileData) => api.put('/students/profile', profileData),
    getStats: () => api.get('/students/stats'),
};

export const requestAPI = {
    create: (requestData) => api.post('/requests', requestData),
    getAll: () => api.get('/requests'),
    getById: (id) => api.get(`/requests/${id}`),
    parentApprove: (id, approved, comments = '') =>
        api.put(`/requests/${id}/parent-approve`, { approved, comments }),
    adminApprove: (id, approved, comments = '') =>
        api.put(`/requests/${id}/admin-approve`, { approved, comments }),
    getQR: (id) => api.get(`/requests/${id}/qr`),
};

export const parentAPI = {
    getDashboard: () => api.get('/parents/dashboard'),
    getPendingApprovals: () => api.get('/parents/pending-approvals'),
    getActivity: () => api.get('/parents/activity'),
};

export const riskAPI = {
    compute: (features) => api.post('/pass/risk', features),
};

export const adminAPI = {
    getOverview: () => api.get('/admin/overview'),
    getQueue: () => api.get('/admin/queue'),
    getStudents: () => api.get('/admin/students'),
    getAnalytics: () => api.get('/admin/analytics'),
};

export const violationAPI = {
    getAll: () => api.get('/violations'),
    create: (violationData) => api.post('/violations', violationData),
    resolve: (id, status, adminNotes = '') =>
        api.put(`/violations/${id}/resolve`, { status, adminNotes }),
};

export default api;
