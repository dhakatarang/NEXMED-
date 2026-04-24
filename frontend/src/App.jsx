// frontend/src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';

import LandingPage from './pages/LandingPage';
import SignUp from './pages/SignUp';
import Login from './pages/Login';
import Home from './pages/Home';
import Medicines from './pages/Medicine';
import MedicineDetails from './pages/MedicineDetails';
import MedicalEquipment from './pages/MedicalEquipment';
import MedicalEquipmentDetails from './pages/MedicalEquipmentDetails';
import DonateRent from './pages/DonateRent';
import About from './pages/About';
import Profile from './pages/Profile';
import Cart from './pages/Cart';
import AdminPanel from './pages/AdminPanel'; // NEW: Admin Panel

import Navbar from './components/Navbar';
import Footer from './components/Footer';

// ✅ AXIOS INTERCEPTORS
const setupAxiosInterceptors = () => {
  axios.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.dispatchEvent(new Event('loginStateChange'));
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );
};

// ✅ Layout wrapper only for logged-in routes
function Layout({ children }) {
  return (
    <div className="app">
      <Navbar />
      <main className="main-content">{children}</main>
      <Footer />
    </div>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setupAxiosInterceptors();
  }, []);

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);
    window.addEventListener('loginStateChange', checkLoginStatus);
    const interval = setInterval(checkLoginStatus, 1000);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
      window.removeEventListener('loginStateChange', checkLoginStatus);
      clearInterval(interval);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* 🟣 Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
        <Route path="/signup" element={<SignUp />} />

        {/* 🟢 Protected Routes */}
        <Route
          path="/home"
          element={
            isLoggedIn ? (
              <Layout>
                <Home />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/medicines"
          element={
            isLoggedIn ? (
              <Layout>
                <Medicines />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/medicines/:id"
          element={
            isLoggedIn ? (
              <Layout>
                <MedicineDetails />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/medicalequipments"
          element={
            isLoggedIn ? (
              <Layout>
                <MedicalEquipment />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/medicalequipments/:id"
          element={
            isLoggedIn ? (
              <Layout>
                <MedicalEquipmentDetails />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/donaterent"
          element={
            isLoggedIn ? (
              <Layout>
                <DonateRent />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/about"
          element={
            isLoggedIn ? (
              <Layout>
                <About />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            isLoggedIn ? (
              <Layout>
                <Profile />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/cart"
          element={
            isLoggedIn ? (
              <Layout>
                <Cart />
              </Layout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* NEW: Admin Routes */}
        <Route
          path="/admin/*"
          element={
            isLoggedIn ? (
              <AdminPanel />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Default Route */}
        <Route
          path="*"
          element={<Navigate to={isLoggedIn ? '/home' : '/'} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;