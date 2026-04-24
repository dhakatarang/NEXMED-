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

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      const response = await axios.get('https://nexmed.onrender.com/api/admin/medicines');
      if (response.data.success) {
        setMedicines(response.data.medicines);
      }
    } catch (error) {
      console.error('Error fetching medicines:', error);
      showMessage('Error fetching medicines', 'error');
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
    if (!window.confirm(`Are you sure you want to delete "${medicineName}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`https://nexmed.onrender.com/api/admin/medicines/${medicineId}`);
      if (response.data.success) {
        showMessage('Medicine deleted successfully', 'success');
        setMedicines(medicines.filter(med => med.id !== medicineId));
      }
    } catch (error) {
      console.error('Error deleting medicine:', error);
      showMessage('Error deleting medicine', 'error');
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (quantity < 10) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const getExpiryStatus = (expiryDate) => {
    if (!expiryDate) return { text: 'No Expiry', class: 'no-expiry' };
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', class: 'expired' };
    if (diffDays <= 30) return { text: 'Expiring Soon', class: 'expiring-soon' };
    return { text: 'Valid', class: 'valid' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getTypeClass = (optionType) => {
    return optionType === 'donate' ? 'donate' : 'sell';
  };

  const filteredMedicines = medicines.filter(medicine => {
    if (filter !== 'all') {
      const status = getStockStatus(medicine.quantity).text;
      if (filter === 'in-stock' && status !== 'In Stock') return false;
      if (filter === 'low-stock' && status !== 'Low Stock') return false;
      if (filter === 'out-of-stock' && status !== 'Out of Stock') return false;
    }
    
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      medicine.name?.toLowerCase().includes(search) ||
      medicine.description?.toLowerCase().includes(search) ||
      medicine.option_type?.toLowerCase().includes(search) ||
      medicine.added_by_name?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: medicines.length,
    inStock: medicines.filter(m => m.quantity >= 10).length,
    lowStock: medicines.filter(m => m.quantity > 0 && m.quantity < 10).length,
    outOfStock: medicines.filter(m => m.quantity === 0).length,
    expired: medicines.filter(m => {
      if (!m.expiry_date) return false;
      return new Date(m.expiry_date) < new Date();
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
        <button onClick={fetchMedicines} className="refresh-btn">
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
          <div className="stat-label">Total Medicines</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.inStock}</div>
          <div className="stat-label">In Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
        <div className="stat-card">
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
            All
          </button>
          <button 
            className={`filter-btn ${filter === 'in-stock' ? 'active' : ''}`}
            onClick={() => setFilter('in-stock')}
          >
            In Stock
          </button>
          <button 
            className={`filter-btn ${filter === 'low-stock' ? 'active' : ''}`}
            onClick={() => setFilter('low-stock')}
          >
            Low Stock
          </button>
          <button 
            className={`filter-btn ${filter === 'out-of-stock' ? 'active' : ''}`}
            onClick={() => setFilter('out-of-stock')}
          >
            Out of Stock
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by name, description, or added by..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
                  const expiryStatus = getExpiryStatus(medicine.expiry_date);
                  const typeClass = getTypeClass(medicine.option_type);
                  
                  return (
                    <tr key={medicine.id}>
                      <td className="id-column">#{medicine.id}</td>
                      <td>
                        <div className="item-info">
                          <div className="item-name">{medicine.name}</div>
                          <div className="item-description">{medicine.description}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${typeClass}`}>
                          {medicine.option_type}
                        </span>
                      </td>
                      <td className="price-column">
                        {medicine.option_type === 'sell' ? (
                          <span className="price-value">${medicine.price}</span>
                        ) : (
                          <span className="price-free">Free</span>
                        )}
                      </td>
                      <td className="quantity-column">
                        <span className="quantity-badge">{medicine.quantity}</span>
                      </td>
                      <td>
                        <span className={`stock-badge ${stockStatus.class}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <span className={`expiry-badge ${expiryStatus.class}`}>
                          {expiryStatus.text}
                          {medicine.expiry_date && expiryStatus.class !== 'no-expiry' && (
                            <span className="expiry-date">{formatDate(medicine.expiry_date)}</span>
                          )}
                        </span>
                      </td>
                      <td className="added-by">{medicine.added_by_name || 'Unknown'}</td>
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