// frontend/src/pages/AdminPanel.jsx
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

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = localStorage.getItem('user');
      if (!userData) {
        window.location.href = '/login';
        return;
      }

      const user = JSON.parse(userData);
      setUser(user);

      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.data.success) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }

      setLoading(false);
    } catch (error) {
      if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please login again.');
      } else {
        setError('Error checking admin access. Please try again.');
      }
      setLoading(false);
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="loading-spinner"></div>
        <p>Checking admin access...</p>
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
            <p className="admin-name">{user?.name}</p>
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