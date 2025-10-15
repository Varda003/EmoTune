import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
// Add token to requests if available
// Handle token expiration
// Add token to requests if available


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    console.log('🔑 Sending request to:', config.url);
    console.log('🔑 Token exists:', !!token);
    
    if (token) {
      // Remove any quotes or whitespace
      const cleanToken = token.trim().replace(/^["']|["']$/g, '');
      config.headers.Authorization = `Bearer ${cleanToken}`;
      console.log('✅ Token first 20 chars:', cleanToken.substring(0, 20));
    } else {
      console.log('❌ No token in localStorage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear storage and redirect to login
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ==================== AUTHENTICATION ====================

export const authAPI = {
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  verifyResetCode: async (email, code) => {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response.data;
  },

  resetPassword: async (email, code, newPassword) => {
    const response = await api.post('/auth/reset-password', {
      email,
      code,
      new_password: newPassword,
    });
    return response.data;
  },

  validateToken: async () => {
    const response = await api.get('/auth/validate-token');
    return response.data;
  },
};

// ==================== EMOTION DETECTION ====================

export const emotionAPI = {
  detectFromUpload: async (imageFile) => {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await api.post('/emotion/detect-upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  detectFromLive: async (base64Frame) => {
    const response = await api.post('/emotion/detect-live', {
      frame: base64Frame,
    });
    return response.data;
  },

  getModelInfo: async () => {
    const response = await axios.get(`${API_BASE}/emotion/model-info`);
    return response.data;
  },

  test: async () => {
    const response = await axios.get(`${API_BASE}/emotion/test`);
    return response.data;
  },
};

// ==================== MUSIC ====================

export const musicAPI = {
  getRecommendations: async (emotion, language = 'english', limit = 6) => {
    const response = await api.get(`/music/recommendations/${emotion}`, {
      params: { language, limit },
    });
    return response.data;
  },

  likeSong: async (songData) => {
    const response = await api.post('/music/like', songData);
    return response.data;
  },

  unlikeSong: async (songId) => {
    const response = await api.delete(`/music/unlike/${songId}`);
    return response.data;
  },

  getLikedSongs: async (limit = null, emotion = null) => {
    const params = {};
    if (limit) params.limit = limit;
    if (emotion) params.emotion = emotion;

    const response = await api.get('/music/liked', { params });
    return response.data;
  },

  searchTracks: async (query, limit = 10) => {
    const response = await api.get('/music/search', {
      params: { q: query, limit },
    });
    return response.data;
  },

  test: async () => {
    const response = await axios.get(`${API_BASE}/music/test`);
    return response.data;
  },
};

// ==================== USER PROFILE ====================

export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (updates) => {
    const response = await api.put('/user/profile/edit', updates);
    return response.data;
  },

  uploadProfilePicture: async (imageFile) => {
    const formData = new FormData();
    formData.append('picture', imageFile);

    const response = await api.post('/user/profile/picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/user/account', {
      data: { confirm: true },
    });
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get('/user/statistics');
    return response.data;
  },

  getPreferences: async () => {
    const response = await api.get('/user/preferences');
    return response.data;
  },

  updatePreferences: async (preferences) => {
    const response = await api.put('/user/preferences', preferences);
    return response.data;
  },
};

// ==================== HELPER FUNCTIONS ====================

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('access_token', token);
  } else {
    localStorage.removeItem('access_token');
  }
};

export const setUser = (user) => {
  if (user) {
    localStorage.setItem('user', JSON.stringify(user));
  } else {
    localStorage.removeItem('user');
  }
};

export const getUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!localStorage.getItem('access_token');
};

export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user');
  window.location.href = '/login';
};

export default api;