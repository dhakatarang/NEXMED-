/*

  Dashboard -> (Admin Dashboard)

*/

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
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch medicines
      const medicinesRes = await axios.get('https://nexmed.onrender.com/api/medicines/all');
      if (medicinesRes.data.success) {
        setMedicines(medicinesRes.data.medicines || []);
      }
      
      // Fetch equipment
      const equipmentsRes = await axios.get('https://nexmed.onrender.com/api/equipments/all');
      if (equipmentsRes.data.success) {
        setEquipments(equipmentsRes.data.equipments || []);
      }
      
      // Fetch users (if admin endpoint exists)
      try {
        const usersRes = await axios.get('https://nexmed.onrender.com/api/users');
        if (usersRes.data.success) {
          setUsers(usersRes.data.users || []);
        }
      } catch (err) {
        console.log('Users endpoint not available');
      }
      
    } catch (err) {
      console.error('Dashboard error:', err);
      setError('Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateExpiryStatus = (medicine) => {
    if (!medicine.expiry_date) return null;
    
    const today = new Date();
    const expiryDate = new Date(medicine.expiry_date);
    const daysUntilExpiry = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring-soon';
    return 'valid';
  };

  const expiringMedicines = medicines.filter(med => calculateExpiryStatus(med) === 'expiring-soon');
  const expiredMedicines = medicines.filter(med => calculateExpiryStatus(med) === 'expired');
  const validMedicines = medicines.filter(med => calculateExpiryStatus(med) === 'valid');

  const getOptionTypeCount = (items, type) => {
    return items.filter(item => item.optionType === type).length;
  };

  const getTotalValue = (items) => {
    return items.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleViewItem = (type, id) => {
    navigate(`/${type}/${id}`);
  };

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
        <button className="refresh-btn" onClick={fetchDashboardData}>
          Refresh Data
        </button>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Tab Navigation */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'medicines' ? 'active' : ''}`}
          onClick={() => setActiveTab('medicines')}
        >
          Medicines
        </button>
        <button 
          className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
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
                <span className="stat-value">₹{getTotalValue([...medicines, ...equipments])}</span>
              </div>
            </div>
          </div>

          {/* Status Cards */}
          <div className="status-grid">
            <div className="status-card warning">
              <h3>Expiring Soon</h3>
              <p className="status-number">{expiringMedicines.length}</p>
              <p className="status-label">Medicines expiring in 30 days</p>
            </div>
            
            <div className="status-card expired">
              <h3>Expired</h3>
              <p className="status-number">{expiredMedicines.length}</p>
              <p className="status-label">Medicines past expiry date</p>
            </div>
            
            <div className="status-card valid">
              <h3>Valid</h3>
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
                    <span className="recent-type">{med.optionType}</span>
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
                  
                  <p className="item-description">{medicine.description}</p>
                  
                  <div className="item-details">
                    <div className="detail-row">
                      <span>Type:</span>
                      <span className={`type-tag ${medicine.optionType}`}>{medicine.optionType}</span>
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
                    {medicine.expiry_date && (
                      <div className="detail-row">
                        <span>Expires:</span>
                        <span>{new Date(medicine.expiry_date).toLocaleDateString()}</span>
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
                    <span className={`type-tag ${equipment.optionType}`}>{equipment.optionType}</span>
                  </div>
                  
                  <p className="item-description">{equipment.description}</p>
                  
                  <div className="item-details">
                    <div className="detail-row">
                      <span>Condition:</span>
                      <span>{equipment.condition}</span>
                    </div>
                    <div className="detail-row">
                      <span>Quantity:</span>
                      <span>{equipment.quantity}</span>
                    </div>
                    {equipment.optionType === 'sell' && equipment.price > 0 && (
                      <div className="detail-row">
                        <span>Price:</span>
                        <span className="price">₹{equipment.price}</span>
                      </div>
                    )}
                    {equipment.optionType === 'rent' && equipment.rentPrice > 0 && (
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
                    {user.profile_photo ? (
                      <img src={`https://nexmed.onrender.com${user.profile_photo}`} alt={user.name} />
                    ) : (
                      <div className="avatar-placeholder">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="user-email">{user.email}</p>
                    <div className="user-meta">
                      <span className="user-type">{user.user_type || 'user'}</span>
                      <span className="user-id">ID: {user.id}</span>
                    </div>
                  </div>
                  
                  <button className="view-btn small">
                    View Profile
                  </button>
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