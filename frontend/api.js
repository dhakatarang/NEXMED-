import axios from 'axios';

// Dynamic baseURL based on environment
const getBaseURL = () => {
  // Production (deployed on Render/Vercel)
  if (import.meta.env.PROD) {
    return 'https://nexmed.onrender.com/api';
  }
  // Development (local)
  return 'http://localhost:5001/api';
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
});

// Add a request interceptor to include the auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // For demo purposes, use user ID as token (as per your backend)
      const userId = localStorage.getItem('userId');
      if (userId) {
        config.headers.Authorization = `Bearer ${userId}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth functions
export const login = (credentials) => API.post('/auth/login', credentials);
export const signup = (userData) => API.post('/auth/signup', userData);
export const getCurrentUser = () => API.get('/auth/me');

// Profile functions
export const getProfile = () => API.get("/profile/me");
export const updateProfile = (data) => API.put("/profile/update", data);

// Donate Rent functions
export const donateItem = (data) => API.post("/donaterent/add", data);
export const getDonations = () => API.get("/donaterent");
export const getAllItems = () => API.get("/donaterent/all");
export const getMyItems = () => API.get("/donaterent/my-items");
export const getItemsByType = (itemType) => API.get(`/donaterent/type/${itemType}`);
export const getItemById = (id) => API.get(`/donaterent/item/${id}`);

// Medicines functions
export const getAllMedicines = () => API.get("/medicines/all");
export const getMedicinesByType = (optionType) => API.get(`/medicines/type/${optionType}`);
export const buyMedicine = (id, quantity = 1) => API.post(`/medicines/buy/${id}`, { quantity });
export const getMyMedicines = () => API.get("/medicines/my-medicines");

// Equipment functions
export const getAllEquipment = () => API.get("/equipments/all");
export const getEquipmentByType = (optionType) => API.get(`/equipments/type/${optionType}`);
export const equipmentAction = (id, action, quantity = 1) => API.post(`/equipments/action/${id}`, { action, quantity });
export const getMyEquipment = () => API.get("/equipments/my-equipment");

export default API;