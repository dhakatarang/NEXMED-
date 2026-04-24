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

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/admin/users');
      if (response.data.success) {
        setUsers(response.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showMessage('Error fetching users', 'error');
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
      const response = await axios.put(`http://localhost:5001/api/admin/users/${userId}/role`, {
        role: newRole
      });
      
      if (response.data.success) {
        showMessage('User role updated successfully', 'success');
        setUsers(users.map(user => 
          user.id === userId ? { ...user, role: newRole } : user
        ));
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      showMessage('Error updating user role', 'error');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await axios.put(`http://localhost:5001/api/admin/users/${userId}/status`, {
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
      showMessage('Error updating user status', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(search) ||
      user.email?.toLowerCase().includes(search) ||
      user.user_type?.toLowerCase().includes(search) ||
      user.id.toString().includes(search)
    );
  });

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length
  };

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
        <button onClick={fetchUsers} className="refresh-btn">
          Refresh
        </button>
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
        <div className="stat-card">
          <div className="stat-value">{stats.active}</div>
          <div className="stat-label">Active</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inactive}</div>
          <div className="stat-label">Inactive</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.admins}</div>
          <div className="stat-label">Admins</div>
        </div>
      </div>

      {/* Search */}
      <div className="search-section">
        <input
          type="text"
          placeholder="Search by name, email, or user type..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
                        <div className="user-avatar">
                          {user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="user-name">{user.name}</div>
                      </div>
                    </td>
                    <td className="user-email">{user.email}</td>
                    <td>
                      <span className="user-type-badge">{user.user_type || 'user'}</span>
                    </td>
                    <td>
                      <select
                        value={user.role || 'user'}
                        onChange={(e) => updateUserRole(user.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="join-date">{formatDate(user.created_at)}</td>
                    <td>
                      <button
                        onClick={() => toggleUserStatus(user.id, user.is_active)}
                        className={`action-btn ${user.is_active ? 'deactivate' : 'activate'}`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? 'Deactivate' : 'Activate'}
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

export default AdminUsers;