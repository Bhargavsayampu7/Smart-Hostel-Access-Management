// API Service Layer
const API_BASE_URL = window.location.origin + '/api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Set auth token in localStorage
const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('authToken', token);
  } else {
    localStorage.removeItem('authToken');
  }
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// Auth API
const authAPI = {
  login: async (email, password) => {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    setAuthToken(data.token);
    return data;
  },

  register: async (userData) => {
    const data = await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    setAuthToken(data.token);
    return data;
  },

  getCurrentUser: async () => {
    return await apiRequest('/auth/me');
  },

  logout: () => {
    setAuthToken(null);
    localStorage.removeItem('currentUser');
  }
};

// Student API
const studentAPI = {
  getProfile: async () => {
    return await apiRequest('/students/profile');
  },

  updateProfile: async (profileData) => {
    return await apiRequest('/students/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  },

  getStats: async () => {
    return await apiRequest('/students/stats');
  }
};

// Request API
const requestAPI = {
  create: async (requestData) => {
    return await apiRequest('/requests', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  getAll: async () => {
    return await apiRequest('/requests');
  },

  getById: async (id) => {
    return await apiRequest(`/requests/${id}`);
  },

  parentApprove: async (id, approved, comments = '') => {
    return await apiRequest(`/requests/${id}/parent-approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved, comments })
    });
  },

  adminApprove: async (id, approved, comments = '') => {
    return await apiRequest(`/requests/${id}/admin-approve`, {
      method: 'PUT',
      body: JSON.stringify({ approved, comments })
    });
  },

  getQR: async (id) => {
    return await apiRequest(`/requests/${id}/qr`);
  }
};

// Parent API
const parentAPI = {
  getDashboard: async () => {
    return await apiRequest('/parents/dashboard');
  },

  getPendingApprovals: async () => {
    return await apiRequest('/parents/pending-approvals');
  },

  getActivity: async () => {
    return await apiRequest('/parents/activity');
  }
};

// Admin API
const adminAPI = {
  getOverview: async () => {
    return await apiRequest('/admin/overview');
  },

  getQueue: async () => {
    return await apiRequest('/admin/queue');
  },

  getStudents: async () => {
    return await apiRequest('/admin/students');
  },

  getReports: async () => {
    return await apiRequest('/admin/reports');
  }
};

// Violation API
const violationAPI = {
  getAll: async () => {
    return await apiRequest('/violations');
  },

  create: async (violationData) => {
    return await apiRequest('/violations', {
      method: 'POST',
      body: JSON.stringify(violationData)
    });
  },

  resolve: async (id, status, adminNotes = '') => {
    return await apiRequest(`/violations/${id}/resolve`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNotes })
    });
  }
};

// Export API object
window.API = {
  auth: authAPI,
  student: studentAPI,
  request: requestAPI,
  parent: parentAPI,
  admin: adminAPI,
  violation: violationAPI,
  getAuthToken,
  setAuthToken
};

