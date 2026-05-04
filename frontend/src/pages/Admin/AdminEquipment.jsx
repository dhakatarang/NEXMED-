import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminEquipment.css';

const AdminEquipment = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

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
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints
      let response;
      
      try {
        response = await axiosInstance.get('/api/admin/equipment');
      } catch (err) {
        // Try alternative endpoint
        try {
          response = await axiosInstance.get('/api/equipments/all');
        } catch (e) {
          // Try another alternative
          response = await axiosInstance.get('/api/equipments');
        }
      }
      
      if (response.data.success) {
        setEquipment(response.data.equipment || response.data.equipments || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch equipment');
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showMessage('Error fetching equipment: ' + (error.response?.data?.message || error.message), 'error');
      setEquipment([]);
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

  const deleteEquipment = async (equipmentId, equipmentName) => {
    if (!window.confirm(`Are you sure you want to delete "${equipmentName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      let response;
      try {
        response = await axiosInstance.delete(`/api/admin/equipment/${equipmentId}`);
      } catch (err) {
        // Try alternative endpoint
        response = await axiosInstance.delete(`/api/equipments/${equipmentId}`);
      }
      
      if (response.data.success) {
        showMessage('Equipment deleted successfully', 'success');
        setEquipment(equipment.filter(item => item.id !== equipmentId));
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      showMessage('Error deleting equipment: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const getStockStatus = (quantity) => {
    const qty = quantity || 0;
    if (qty === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (qty < 5) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const getConditionClass = (condition) => {
    const classes = {
      excellent: 'excellent',
      good: 'good',
      fair: 'fair',
      poor: 'poor',
      'very good': 'good'
    };
    return classes[condition?.toLowerCase()] || 'unknown';
  };

  const getTypeClass = (optionType) => {
    const classes = {
      donate: 'donate',
      sell: 'sell',
      rent: 'rent'
    };
    return classes[optionType?.toLowerCase()] || '';
  };

  const getPriceDisplay = (item) => {
    const type = item.option_type || item.optionType;
    if (type === 'sell') return `₹${item.price || 0}`;
    if (type === 'rent') return `₹${item.rentPrice || item.rent_price || 0}/day`;
    return 'Free';
  };

  const filteredEquipment = equipment.filter(item => {
    if (filter !== 'all') {
      const status = getStockStatus(item.quantity).text;
      if (filter === 'in-stock' && status !== 'In Stock') return false;
      if (filter === 'low-stock' && status !== 'Low Stock') return false;
      if (filter === 'out-of-stock' && status !== 'Out of Stock') return false;
    }
    
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (item.name || '').toLowerCase().includes(search) ||
      (item.description || '').toLowerCase().includes(search) ||
      (item.option_type || item.optionType || '').toLowerCase().includes(search) ||
      (item.condition || '').toLowerCase().includes(search) ||
      (item.added_by_name || item.donor_name || '').toLowerCase().includes(search)
    );
  });

  const stats = {
    total: equipment.length,
    inStock: equipment.filter(m => (m.quantity || 0) >= 5).length,
    lowStock: equipment.filter(m => (m.quantity || 0) > 0 && (m.quantity || 0) < 5).length,
    outOfStock: equipment.filter(m => (m.quantity || 0) === 0).length
  };

  if (loading) {
    return (
      <div className="equipment-loading">
        <div className="loading-spinner"></div>
        <p>Loading equipment...</p>
      </div>
    );
  }

  return (
    <div className="equipment-page">
      {/* Header */}
      <div className="equipment-header">
        <div className="header-left">
          <h1>Equipment Management</h1>
          <p>Manage and monitor medical equipment inventory</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchEquipment} className="refresh-btn">
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
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>
        <div className="stat-card success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inStock}</div>
            <div className="stat-label">In Stock</div>
          </div>
        </div>
        <div className="stat-card warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>
        <div className="stat-card danger">
          <div className="stat-icon">⛔</div>
          <div className="stat-content">
            <div className="stat-value">{stats.outOfStock}</div>
            <div className="stat-label">Out of Stock</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-tabs">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({stats.total})
          </button>
          <button 
            className={`filter-btn ${filter === 'in-stock' ? 'active' : ''}`}
            onClick={() => setFilter('in-stock')}
          >
            In Stock ({stats.inStock})
          </button>
          <button 
            className={`filter-btn ${filter === 'low-stock' ? 'active' : ''}`}
            onClick={() => setFilter('low-stock')}
          >
            Low Stock ({stats.lowStock})
          </button>
          <button 
            className={`filter-btn ${filter === 'out-of-stock' ? 'active' : ''}`}
            onClick={() => setFilter('out-of-stock')}
          >
            Out of Stock ({stats.outOfStock})
          </button>
        </div>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by name, description, or condition..."
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

      {/* Equipment Table */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="equipment-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Equipment</th>
                <th>Type</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Stock</th>
                <th>Condition</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <div className="empty-content">
                      <div className="empty-icon">🏥</div>
                      <h3>No Equipment Found</h3>
                      <p>No equipment matches your search criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map(item => {
                  const stockStatus = getStockStatus(item.quantity);
                  const conditionClass = getConditionClass(item.condition);
                  const typeClass = getTypeClass(item.option_type || item.optionType);
                  
                  return (
                    <tr key={item.id}>
                      <td className="id-column">#{item.id}</td>
                      <td>
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-description">
                            {item.description?.substring(0, 60)}
                            {item.description?.length > 60 ? '...' : ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${typeClass}`}>
                          {item.option_type || item.optionType || 'sell'}
                        </span>
                      </td>
                      <td className="price-column">
                        <span className={`price-value ${item.option_type || item.optionType}`}>
                          {getPriceDisplay(item)}
                        </span>
                      </td>
                      <td className="quantity-column">
                        <span className={`quantity-badge ${(item.quantity || 0) === 0 ? 'zero' : ''}`}>
                          {item.quantity || 0}
                        </span>
                      </td>
                      <td>
                        <span className={`stock-badge ${stockStatus.class}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <span className={`condition-badge ${conditionClass}`}>
                          {item.condition || 'good'}
                        </span>
                      </td>
                      <td className="added-by">
                        {item.added_by_name || item.donor_name || 'Unknown'}
                      </td>
                      <td>
                        <button
                          onClick={() => deleteEquipment(item.id, item.name)}
                          className="delete-btn"
                          disabled={(item.quantity || 0) > 0}
                          title={(item.quantity || 0) > 0 ? 'Cannot delete equipment with stock' : 'Delete equipment'}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="table-footer">
          <span className="table-info">
            Showing {filteredEquipment.length} of {equipment.length} items
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminEquipment;