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

  useEffect(() => {
    fetchEquipment();
  }, []);

  const fetchEquipment = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/admin/equipment');
      if (response.data.success) {
        setEquipment(response.data.equipment);
      }
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showMessage('Error fetching equipment', 'error');
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
    if (!window.confirm(`Are you sure you want to delete "${equipmentName}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(`http://localhost:5001/api/admin/equipment/${equipmentId}`);
      if (response.data.success) {
        showMessage('Equipment deleted successfully', 'success');
        setEquipment(equipment.filter(item => item.id !== equipmentId));
      }
    } catch (error) {
      console.error('Error deleting equipment:', error);
      showMessage('Error deleting equipment', 'error');
    }
  };

  const getStockStatus = (quantity) => {
    if (quantity === 0) return { text: 'Out of Stock', class: 'out-of-stock' };
    if (quantity < 5) return { text: 'Low Stock', class: 'low-stock' };
    return { text: 'In Stock', class: 'in-stock' };
  };

  const getConditionClass = (condition) => {
    const classes = {
      excellent: 'excellent',
      good: 'good',
      fair: 'fair',
      poor: 'poor'
    };
    return classes[condition] || 'unknown';
  };

  const getTypeClass = (optionType) => {
    const classes = {
      donate: 'donate',
      sell: 'sell',
      rent: 'rent'
    };
    return classes[optionType] || '';
  };

  const getPriceDisplay = (item) => {
    if (item.option_type === 'sell') return `$${item.price}`;
    if (item.option_type === 'rent') return `$${item.rent_price}/day`;
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
      item.name?.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.option_type?.toLowerCase().includes(search) ||
      item.condition?.toLowerCase().includes(search)
    );
  });

  const stats = {
    total: equipment.length,
    inStock: equipment.filter(m => m.quantity >= 5).length,
    lowStock: equipment.filter(m => m.quantity > 0 && m.quantity < 5).length,
    outOfStock: equipment.filter(m => m.quantity === 0).length
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
        <button onClick={fetchEquipment} className="refresh-btn">
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
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Items</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inStock}</div>
            <div className="stat-label">In Stock</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.lowStock}</div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>
        <div className="stat-card">
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
          placeholder="Search by name, description, or condition..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
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
                  const typeClass = getTypeClass(item.option_type);
                  
                  return (
                    <tr key={item.id}>
                      <td className="id-column">#{item.id}</td>
                      <td>
                        <div className="item-info">
                          <div className="item-name">{item.name}</div>
                          <div className="item-description">{item.description}</div>
                        </div>
                      </td>
                      <td>
                        <span className={`type-badge ${typeClass}`}>
                          {item.option_type}
                        </span>
                      </td>
                      <td className="price-column">
                        <span className={`price-value ${item.option_type}`}>
                          {getPriceDisplay(item)}
                        </span>
                      </td>
                      <td className="quantity-column">
                        <span className="quantity-badge">{item.quantity}</span>
                      </td>
                      <td>
                        <span className={`stock-badge ${stockStatus.class}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td>
                        <span className={`condition-badge ${conditionClass}`}>
                          {item.condition || 'unknown'}
                        </span>
                      </td>
                      <td className="added-by">{item.added_by_name || 'Unknown'}</td>
                      <td>
                        <button
                          onClick={() => deleteEquipment(item.id, item.name)}
                          className="delete-btn"
                          disabled={item.quantity > 0}
                          title={item.quantity > 0 ? 'Cannot delete equipment with stock' : 'Delete equipment'}
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