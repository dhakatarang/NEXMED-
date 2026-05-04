// frontend/src/pages/admin/AdminUsers.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminUsers.css';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // ✅ Get base URL dynamically based on environment
  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return 'https://nexmed.onrender.com';
  };

  const BASE_URL = getBaseUrl();

  // ✅ Axios instance with auth header
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

  const checkAdminAccess = () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token) {
      showMessage('Please login to access this page', 'error');
      setTimeout(() => window.location.href = '/login', 2000);
      return;
    }
    
    try {
      const user = JSON.parse(userStr || '{}');
      // Check if user is admin
      if (user.userType !== 'admin' && user.user_type !== 'admin' && user.role !== 'admin') {
        showMessage('Access denied. Admin privileges required.', 'error');
        setTimeout(() => window.location.href = '/home', 2000);
        return;
      }
      
      setIsAdmin(true);
      fetchUsers();
    } catch (err) {
      showMessage('Authentication error. Please login again.', 'error');
      setTimeout(() => window.location.href = '/login', 2000);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints that might be available
      let response;
      
      try {
        response = await axiosInstance.get('/api/admin/users');
      } catch (err) {
        // Try alternative endpoint
        try {
          response = await axiosInstance.get('/api/users');
        } catch (e) {
          // Try another alternative
          response = await axiosInstance.get('/api/auth/users');
        }
      }
      
      if (response.data.success) {
        setUsers(response.data.users || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Error fetching users: ' + (error.response?.data?.message || error.message), 'error');
      // Set empty users array to avoid errors
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const updateUserRole = async (userId, newRole) => {
    try {
      const response = await axiosInstance.put(`/api/admin/users/${userId}/role`, {
        role: newRole
      });
      
      if (response.data.success) {
        showMessage('User role updated successfully', 'success');
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole, user_type: newRole } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showMessage('Error updating user role: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await axiosInstance.put(`/api/admin/users/${userId}/status`, {
        is_active: !currentStatus
      });
      
      if (response.data.success) {
        showMessage(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      showMessage('Error updating user status: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(search) ||
      (user.email || '').toLowerCase().includes(search) ||
      (user.user_type || user.role || 'user').toLowerCase().includes(search) ||
      user.id.toString().includes(search)
    );
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active === 1 || u.is_active === true).length,
    inactive: users.filter(u => u.is_active === 0 || u.is_active === false).length,
    admins: users.filter(u => u.role === 'admin' || u.user_type === 'admin').length
  };

  if (!isAdmin && !loading) {
    return (
      <div className="access-denied">
        <div className="error-icon">⚠️</div>
        <h2>Access Denied</h2>
        <p>You do not have permission to access this page.</p>
        <button onClick={() => window.location.href = '/home'} className="btn-primary">
          Go Back Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="users-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div className="header-left">
          <h1>User Management</h1>
          <p>Manage system users, roles, and permissions</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchUsers} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={() => window.location.href = '/admin/dashboard'} className="back-btn">
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message-banner ${messageType}`}>
          <span className="message-icon">{messageType === 'success' ? '✓' : '!'}</span>
          <span>{message}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card info">
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">Admins</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, email, or user type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>User</th>
                <th>Email</th>
                <th>User Type</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    <div className="empty-content">
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td className="id-column">#{user.id}</td>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar" style={{ backgroundColor: getAvatarColor(user.id) }}>
                          {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-name">{user.name || 'Unnamed'}</div>
                      </div>
                    </td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      <span className={`user-type-badge ${user.user_type || user.role || 'user'}`}>
                        {user.user_type || user.role || 'user'}
                      </span>
                    </td>
                    <td>
                      <select
                        value={user.role || user.user_type || 'user'}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="role-select"
                        disabled={user.id === getCurrentUserId()} // Prevent self-role-change
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${(user.is_active === 1 || user.is_active === true) ? 'active' : 'inactive'}`}>
                        {(user.is_active === 1 || user.is_active === true) ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="join-date">{formatDate(user.created_at || user.createdAt)}</td>
                    <td>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active === 1 || user.is_active === true)}
                        className={`action-btn ${(user.is_active === 1 || user.is_active === true) ? 'deactivate' : 'activate'}`}
                        title={(user.is_active === 1 || user.is_active === true) ? 'Deactivate user' : 'Activate user'}
                        disabled={user.id === getCurrentUserId()} // Prevent self-deactivation
                      >
                        {(user.is_active === 1 || user.is_active === true) ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-footer">
          <span className="table-info">
            Showing {filteredUsers.length} of {users.length} users
          </span>
        </div>
      </div>
    </div>
  );
};

// Helper function to get avatar color based on user ID
const getAvatarColor = (id) => {
  const colors = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#ef4444', '#f97316', '#eab308', '#10b981',
    '#14b8a6', '#06b6d4', '#3b82f6'
  ];
  return colors[(id || 0) % colors.length];
};

// Helper function to get current user ID
const getCurrentUserId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.id;
  } catch {
    return null;
  }
};

export default AdminUsers;