// frontend/src/api.js or frontend/src/services/api.js
import axios from 'axios';

// ✅ Dynamic baseURL based on environment
const getBaseURL = () => {
  // Check if running locally
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5001/api';
  }
  // Production
  return 'https://nexmed-backend.onrender.com/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Add request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;