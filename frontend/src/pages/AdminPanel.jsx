import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import axios from 'axios';
import './AdminPanel.css';

// Admin sub-components
import AdminDashboard from './Admin/AdminDashboard';
import AdminUsers from './Admin/AdminUsers';
import AdminMedicines from './Admin/AdminMedicines';
import AdminEquipment from './Admin/AdminEquipment';
import AdminOrders from './Admin/AdminOrders';
import AdminAnalytics from './Admin/AdminAnalytics';

const AdminPanel = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const location = useLocation();

  // Get base URL dynamically
  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return 'https://nexmed-backend.onrender.com';
  };

  const BASE_URL = getBaseUrl();

  // Create axios instance with dynamic base URL
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add token to requests
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      
      // Get token and user data
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      
      console.log('Checking admin access...', { token: !!token, userData: !!userData });
      
      if (!token || !userData) {
        console.log('No token or user data found');
        setError('Please login to access admin panel');
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
        return;
      }

      const parsedUser = JSON.parse(userData);
      console.log('User data:', parsedUser);
      
      // Check if user has admin role (check multiple possible field names)
      const isAdminUser = parsedUser.role === 'admin' || 
                         parsedUser.userType === 'admin' || 
                         parsedUser.user_type === 'admin';
      
      if (!isAdminUser) {
        console.log('User is not admin');
        setError('Access denied. Admin privileges required.');
        setTimeout(() => {
          window.location.href = '/home';
        }, 2000);
        return;
      }
      
      setUser(parsedUser);
      
      // Verify with backend
      try {
        const response = await axiosInstance.get('/api/admin/dashboard');
        console.log('Admin verification response:', response.data);
        
        if (!response.data.success) {
          setError('Access denied. Admin privileges required.');
          setTimeout(() => {
            window.location.href = '/home';
          }, 2000);
          return;
        }
      } catch (backendError) {
        console.error('Backend verification failed:', backendError);
        // If backend verification fails but user has admin role in localStorage,
        // we still allow access to admin panel (might be network issue)
        if (backendError.response?.status === 403) {
          setError('Access denied. Admin privileges required.');
          setTimeout(() => {
            window.location.href = '/home';
          }, 2000);
          return;
        }
        // For other errors (like network), we still show the admin panel
        console.warn('Backend verification failed but showing admin panel anyway');
      }
      
      setLoading(false);
      
    } catch (error) {
      console.error('Admin access check error:', error);
      setError('Error checking admin access. Please try again.');
      setLoading(false);
      
      // Don't auto-redirect immediately, let user see the error
      setTimeout(() => {
        window.location.href = '/home';
      }, 3000);
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Loading admin panel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-error">
        <div className="error-icon">!</div>
        <h2>Access Denied</h2>
        <p>{error}</p>
        <Link to="/home" className="back-home-btn">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      {/* Admin Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-header">
          <div className="logo">NexMed</div>
          <div className="admin-info">
            <p className="admin-name">{user?.name || user?.full_name || 'Admin'}</p>
            <span className="admin-role">Administrator</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <Link 
            to="/admin" 
            className={`nav-item ${isActiveRoute('/admin') ? 'active' : ''}`}
          >
            <span className="nav-icon">📊</span>
            <span className="nav-text">Dashboard</span>
          </Link>
          <Link 
            to="/admin/users" 
            className={`nav-item ${isActiveRoute('/admin/users') ? 'active' : ''}`}
          >
            <span className="nav-icon">👥</span>
            <span className="nav-text">User Management</span>
          </Link>
          <Link 
            to="/admin/medicines" 
            className={`nav-item ${isActiveRoute('/admin/medicines') ? 'active' : ''}`}
          >
            <span className="nav-icon">💊</span>
            <span className="nav-text">Medicine Management</span>
          </Link>
          <Link 
            to="/admin/equipment" 
            className={`nav-item ${isActiveRoute('/admin/equipment') ? 'active' : ''}`}
          >
            <span className="nav-icon">🏥</span>
            <span className="nav-text">Equipment Management</span>
          </Link>
          <Link 
            to="/admin/orders" 
            className={`nav-item ${isActiveRoute('/admin/orders') ? 'active' : ''}`}
          >
            <span className="nav-icon">📦</span>
            <span className="nav-text">Order Management</span>
          </Link>
          <Link 
            to="/admin/analytics" 
            className={`nav-item ${isActiveRoute('/admin/analytics') ? 'active' : ''}`}
          >
            <span className="nav-icon">📈</span>
            <span className="nav-text">Analytics & Reports</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <Link to="/home" className="back-link">
            ← Back to Main Site
          </Link>
        </div>
      </aside>

      {/* Admin Content */}
      <main className="admin-content">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/medicines" element={<AdminMedicines />} />
          <Route path="/equipment" element={<AdminEquipment />} />
          <Route path="/orders" element={<AdminOrders />} />
          <Route path="/analytics" element={<AdminAnalytics />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPanel;