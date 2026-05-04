// frontend/src/pages/admin/AdminMedicines.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminMedicines.css';

const AdminMedicines = () => {
  const [medicines, setMedicines] = useState([]);
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
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints
      let response;
      
      try {
        response = await axiosInstance.get('/api/admin/medicines');
      } catch (err) {
        // Try alternative endpoint
        try {
          response = await axiosInstance.get('/api/medicines/all');
        } catch (e) {
          // Try another alternative
          response = await axiosInstance.get('/api/medicines');
        }
      }
      
      if (response.data.success) {
        setMedicines(response.data.medicines || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch medicines');
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      showMessage('Error fetching medicines: ' + (error.response?.data?.message || error.message), 'error');
      setMedicines([]);
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

  const deleteMedicine = async (medicineId, medicineName) => {
    if (!window.confirm(`Are you sure you want to delete "${medicineName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      let response;
      try {
        response = await axiosInstance.delete(`/api/admin/medicines/${medicineId}`);
      } catch (err) {
        // Try alternative endpoint
        response = await axiosInstance.delete(`/api/medicines/${medicineId}`);
      }
      
      if (response.data.success) {
        showMessage('Medicine deleted successfully', 'success');
        setMedicines(medicines.filter(med => med.id !== medicineId));
      } else {
        throw new Error(response.data.message || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      showMessage('Error deleting medicine: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const getStockStatus = (quantity) => {
    const qty = quantity || 0;
    if (qty === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (qty < 10) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: 'No Expiry', class: 'no-expiry' };
    
    try {
      const today = new Date();
      const expiry = new Date(expiryDate);
      const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'Expired', class: 'expired' };
      if (diffDays <= 30) return { text: 'Expiring Soon', class: 'expiring-soon' };
      return { text: 'Valid', class: 'valid' };
    } catch (error) {
      return { text: 'Invalid Date', class: 'no-expiry' };
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

  const getTypeClass = (optionType) => {
    return optionType === 'donate' ? 'donate' : 'sell';
  };

  const filteredMedicines = medicines.filter(medicine => {
    if (filter !== 'all') {
      const stockStatus = getStockStatus(medicine.quantity).text;
      if (filter === 'in-stock' && stockStatus !== 'In Stock') return false;
      if (filter === 'low-stock' && stockStatus !== 'Low Stock') return false;
      if (filter === 'out-of-stock' && stockStatus !== 'Out of Stock') return false;
    }
    
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      (medicine.name || '').toLowerCase().includes(search) ||
      (medicine.description || '').toLowerCase().includes(search) ||
      (medicine.option_type || medicine.optionType || '').toLowerCase().includes(search) ||
      (medicine.added_by_name || medicine.donor_name || '').toLowerCase().includes(search)
    );
  });

  const stats = {
    total: medicines.length,
    inStock: medicines.filter(m => (m.quantity || 0) >= 10).length,
    lowStock: medicines.filter(m => (m.quantity || 0) > 0 && (m.quantity || 0) < 10).length,
    outOfStock: medicines.filter(m => (m.quantity || 0) === 0).length,
    expired: medicines.filter(m => {
      if (!m.expiry_date && !m.expiryDate) return false;
      const expiry = new Date(m.expiry_date || m.expiryDate);
      return expiry < new Date();
    }).length
  };

  if (loading) {
    return (
      <div className="medicines-loading">
        <div className="loading-spinner"></div>
        <p>Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="medicines-page">
      {/* Header */}
      <div className="medicines-header">
        <div className="header-left">
          <h1>Medicine Management</h1>
          <p>Manage and monitor medicine inventory</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchMedicines} className="refresh-btn">
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
          <div className="stat-label">Total Medicines</div>
        </div>
        <div className="stat-card success">
          <div className="stat-value">{stats.inStock}</div>
          <div className="stat-label">In Stock</div>
        </div>
        <div className="stat-card warning">
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card danger">
          <div className="stat-value">{stats.outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
        <div className="stat-card expired">
          <div className="stat-value">{stats.expired}</div>
          <div className="stat-label">Expired</div>
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
            placeholder="Search by name, description, or added by..."
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

      {/* Medicines Table */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="medicines-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Medicine</th>
                <th>Type</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Added By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <div className="empty-content">
                      <p>No medicines found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map(medicine => {
                  const stockStatus = getStockStatus(medicine.quantity);
                  const expiryStatus = getExpiryStatus(medicine.expiry_date || medicine.expiryDate);
                  const typeClass = getTypeClass(medicine.option_type || medicine.optionType);
                  
                  return (
                    <tr key={medicine.id}>
                      <td className="id-column">#{medicine.id}</td>
                      <td>
                        <div className="item-info">
                          <div className="item-name">{medicine.name}</div>
                          <div className="item-description">
                            {medicine.description?.substring(0, 60)}
                            {medicine.description?.length > 60 ? '...' : ''}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${typeClass}`}>
                          {medicine.option_type || medicine.optionType || 'sell'}
                        </span>
                      </td>
                      <td className="price-column">
                        {(medicine.option_type === 'sell' || medicine.optionType === 'sell') && medicine.price > 0 ? (
                          <span className="price-value">₹{medicine.price}</span>
                        ) : (
                          <span className="price-free">Free</span>
                        )}
                      </td>
                      <td className="quantity-column">
                        <span className="quantity-badge">{medicine.quantity || 0}</span>
                      </td>
                      <td>
                        <span className={`stock-badge ${stockStatus.class}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <span className={`expiry-badge ${expiryStatus.class}`}>
                          {expiryStatus.text}
                          {medicine.expiry_date && expiryStatus.class !== 'no-expiry' && expiryStatus.class !== 'expired' && (
                            <span className="expiry-date">{formatDate(medicine.expiry_date)}</span>
                          )}
                        </span>
                      </td>
                      <td className="added-by">
                        {medicine.added_by_name || medicine.donor_name || 'Unknown'}
                      </td>
                      <td>
                        <button
                          onClick={() => deleteMedicine(medicine.id, medicine.name)}
                          className="delete-btn"
                          disabled={medicine.quantity > 0}
                          title={medicine.quantity > 0 ? 'Cannot delete medicine with stock' : 'Delete medicine'}
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
            Showing {filteredMedicines.length} of {medicines.length} medicines
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminMedicines;