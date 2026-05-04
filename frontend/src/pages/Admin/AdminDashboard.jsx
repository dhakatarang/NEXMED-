import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';

const Dashboard = () => {
  const [medicines, setMedicines] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [imageErrors, setImageErrors] = useState(new Set());
  const navigate = useNavigate();

  // ✅ Get base URL dynamically based on environment
  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return 'https://nexmed-backend.onrender.com';
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

  const checkAdminAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Check if user is admin
      if (user.userType !== 'admin' && user.user_type !== 'admin') {
        setError('Access denied. Admin privileges required.');
        setTimeout(() => navigate('/home'), 2000);
        return;
      }
      
      setIsAdmin(true);
      fetchDashboardData();
    } catch (err) {
      setError('Authentication error. Please login again.');
      setTimeout(() => navigate('/login'), 2000);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch medicines
      const medicinesRes = await axiosInstance.get('/api/medicines/all');
      if (medicinesRes.data.success) {
        setMedicines(medicinesRes.data.medicines || []);
      }
      
      // Fetch equipment
      const equipmentsRes = await axiosInstance.get('/api/equipments/all');
      if (equipmentsRes.data.success) {
        setEquipments(equipmentsRes.data.equipments || []);
      }
      
      // Fetch users (admin only)
      try {
        const usersRes = await axiosInstance.get('/api/admin/users');
        if (usersRes.data.success) {
          setUsers(usersRes.data.users || []);
        }
      } catch (err) {
        console.log('Users endpoint not available');
        // Try alternative endpoint
        try {
          const usersRes = await axiosInstance.get('/api/users');
          if (usersRes.data.success) {
            setUsers(usersRes.data.users || []);
          }
        } catch (e) {
          console.log('No users endpoint found');
          setUsers([]);
        }
      }
      
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to fetch dashboard data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiryStatus = (medicine) => {
    if (!medicine.expiry_date && !medicine.expiryDate) return null;
    
    const expiryDateStr = medicine.expiry_date || medicine.expiryDate;
    const today = new Date();
    const expiryDate = new Date(expiryDateStr);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const expiringMedicines = medicines.filter(med => calculateExpiryStatus(med) === 'expiring-soon');
  const expiredMedicines = medicines.filter(med => calculateExpiryStatus(med) === 'expired');
  const validMedicines = medicines.filter(med => calculateExpiryStatus(med) === 'valid');

  const getOptionTypeCount = (items, type) => {
    return items.filter(item => item.option_type === type || item.optionType === type).length;
  };

  const getTotalValue = (items) => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleViewItem = (type, id) => {
    if (type === 'medicines') {
      navigate(`/medicines/${id}`);
    } else if (type === 'medicalequipments') {
      navigate(`/medicalequipments/${id}`);
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/uploads/')) return `${BASE_URL}${imagePath}`;
    if (imagePath.startsWith('/')) return `${BASE_URL}${imagePath}`;
    return `${BASE_URL}/uploads/${imagePath}`;
  };

  const handleImageError = (userId) => {
    setImageErrors(prev => new Set(prev.add(userId)));
  };

  if (!isAdmin && !loading) {
    return (
      <div className="dashboard-error-container">
        <div className="error-icon">⚠️</div>
        <h2>Access Denied</h2>
        <p>{error || 'You do not have permission to access this page.'}</p>
        <button onClick={() => navigate('/home')} className="btn btn-primary">
          Go Back Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchDashboardData}>
            🔄 Refresh Data
          </button>
          <button className="back-btn" onClick={() => navigate('/home')}>
            ← Back to Home
          </button>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'medicines' ? 'active' : ''}`}
          onClick={() => setActiveTab('medicines')}
        >
          💊 Medicines
        </button>
        <button 
          className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          ⚕️ Equipment
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Users
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="overview-tab">
          {/* Stats Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">💊</div>
              <div className="stat-content">
                <span className="stat-label">Total Medicines</span>
                <span className="stat-value">{medicines.length}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">⚕️</div>
              <div className="stat-content">
                <span className="stat-label">Total Equipment</span>
                <span className="stat-value">{equipments.length}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <span className="stat-label">Total Users</span>
                <span className="stat-value">{users.length}</span>
              </div>
            </div>
            
            <div className="stat-card">
              <div className="stat-icon">💰</div>
              <div className="stat-content">
                <span className="stat-label">Total Value</span>
                <span className="stat-value">₹{getTotalValue([...medicines, ...equipments]).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card warning">
              <h3>⚠️ Expiring Soon</h3>
              <p className="status-number">{expiringMedicines.length}</p>
              <p className="status-label">Medicines expiring in 30 days</p>
            </div>
            
            <div className="status-card expired">
              <h3>❌ Expired</h3>
              <p className="status-number">{expiredMedicines.length}</p>
              <p className="status-label">Medicines past expiry date</p>
            </div>
            
            <div className="status-card valid">
              <h3>✅ Valid</h3>
              <p className="status-number">{validMedicines.length}</p>
              <p className="status-label">Medicines within expiry</p>
            </div>
          </div>

          {/* Distribution Charts */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>Medicine Distribution</h3>
              <div className="distribution-list">
                <div className="dist-item">
                  <span className="dist-label">Donate</span>
                  <span className="dist-value">{getOptionTypeCount(medicines, 'donate')}</span>
                </div>
                <div className="dist-item">
                  <span className="dist-label">Sell</span>
                  <span className="dist-value">{getOptionTypeCount(medicines, 'sell')}</span>
                </div>
              </div>
            </div>
            
            <div className="chart-card">
              <h3>Equipment Distribution</h3>
              <div className="distribution-list">
                <div className="dist-item">
                  <span className="dist-label">Donate</span>
                  <span className="dist-value">{getOptionTypeCount(equipments, 'donate')}</span>
                </div>
                <div className="dist-item">
                  <span className="dist-label">Sell</span>
                  <span className="dist-value">{getOptionTypeCount(equipments, 'sell')}</span>
                </div>
                <div className="dist-item">
                  <span className="dist-label">Rent</span>
                  <span className="dist-value">{getOptionTypeCount(equipments, 'rent')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Items */}
          <div className="recent-section">
            <h3>Recent Medicines</h3>
            <div className="recent-list">
              {medicines.slice(0, 5).map(med => (
                <div key={med.id} className="recent-item">
                  <div className="recent-info">
                    <strong>{med.name}</strong>
                    <span className={`recent-type ${med.option_type || med.optionType}`}>
                      {med.option_type || med.optionType}
                    </span>
                  </div>
                  <button 
                    className="view-btn small"
                    onClick={() => handleViewItem('medicines', med.id)}
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Medicines Tab */}
      {activeTab === 'medicines' && (
        <div className="medicines-tab">
          <div className="tab-header">
            <h2>All Medicines</h2>
            <span className="item-count">{medicines.length} items</span>
          </div>
          
          {medicines.length === 0 ? (
            <p className="empty-message">No medicines found</p>
          ) : (
            <div className="items-grid">
              {medicines.map(medicine => (
                <div key={medicine.id} className="item-card">
                  <div className="item-card-header">
                    <h4>{medicine.name}</h4>
                    <span className={`status-badge ${calculateExpiryStatus(medicine)}`}>
                      {calculateExpiryStatus(medicine)?.replace('-', ' ') || 'unknown'}
                    </span>
                  </div>
                  
                  <p className="item-description">{medicine.description?.substring(0, 100)}...</p>
                  
                  <div className="item-details">
                    <div className="detail-row">
                      <span>Type:</span>
                      <span className={`type-tag ${medicine.option_type || medicine.optionType}`}>
                        {medicine.option_type || medicine.optionType}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Quantity:</span>
                      <span>{medicine.quantity}</span>
                    </div>
                    {medicine.price > 0 && (
                      <div className="detail-row">
                        <span>Price:</span>
                        <span className="price">₹{medicine.price}</span>
                      </div>
                    )}
                    {(medicine.expiry_date || medicine.expiryDate) && (
                      <div className="detail-row">
                        <span>Expires:</span>
                        <span>{new Date(medicine.expiry_date || medicine.expiryDate).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                  
                  <button 
                    className="view-btn"
                    onClick={() => handleViewItem('medicines', medicine.id)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Equipment Tab */}
      {activeTab === 'equipment' && (
        <div className="equipment-tab">
          <div className="tab-header">
            <h2>All Equipment</h2>
            <span className="item-count">{equipments.length} items</span>
          </div>
          
          {equipments.length === 0 ? (
            <p className="empty-message">No equipment found</p>
          ) : (
            <div className="items-grid">
              {equipments.map(equipment => (
                <div key={equipment.id} className="item-card">
                  <div className="item-card-header">
                    <h4>{equipment.name}</h4>
                    <span className={`type-tag ${equipment.option_type || equipment.optionType}`}>
                      {equipment.option_type || equipment.optionType}
                    </span>
                  </div>
                  
                  <p className="item-description">{equipment.description?.substring(0, 100)}...</p>
                  
                  <div className="item-details">
                    <div className="detail-row">
                      <span>Condition:</span>
                      <span className={`condition-${equipment.condition || 'good'}`}>
                        {equipment.condition || 'Good'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span>Quantity:</span>
                      <span>{equipment.quantity}</span>
                    </div>
                    {(equipment.option_type === 'sell' || equipment.optionType === 'sell') && equipment.price > 0 && (
                      <div className="detail-row">
                        <span>Price:</span>
                        <span className="price">₹{equipment.price}</span>
                      </div>
                    )}
                    {(equipment.option_type === 'rent' || equipment.optionType === 'rent') && equipment.rentPrice > 0 && (
                      <>
                        <div className="detail-row">
                          <span>Rent/Day:</span>
                          <span className="price rent">₹{equipment.rentPrice}</span>
                        </div>
                        {equipment.duration > 0 && (
                          <div className="detail-row">
                            <span>Min. Rental:</span>
                            <span>{equipment.duration} days</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <button 
                    className="view-btn"
                    onClick={() => handleViewItem('medicalequipments', equipment.id)}
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="users-tab">
          <div className="tab-header">
            <h2>Users</h2>
            <span className="item-count">{users.length} users</span>
          </div>
          
          {users.length === 0 ? (
            <p className="empty-message">No users found</p>
          ) : (
            <div className="users-list">
              {users.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    {user.profile_photo && !imageErrors.has(user.id) ? (
                      <img 
                        src={getImageUrl(user.profile_photo)} 
                        alt={user.name}
                        onError={() => handleImageError(user.id)}
                      />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  
                  <div className="user-info">
                    <h4>{user.name || user.full_name || 'Unknown User'}</h4>
                    <p className="user-email">{user.email}</p>
                    <div className="user-meta">
                      <span className="user-type">{user.user_type || user.userType || user.role || 'user'}</span>
                      <span className="user-id">ID: {user.id}</span>
                      <span className={`user-status ${user.is_active !== false ? 'active' : 'inactive'}`}>
                        {user.is_active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;