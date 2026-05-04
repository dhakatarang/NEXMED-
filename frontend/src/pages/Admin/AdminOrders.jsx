// frontend/src/pages/admin/AdminOrders.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminOrders.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

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
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      // Try multiple endpoints
      let response;
      
      try {
        response = await axiosInstance.get('/api/admin/orders');
      } catch (err) {
        // Try alternative endpoint
        try {
          response = await axiosInstance.get('/api/orders');
        } catch (e) {
          // Try another alternative
          response = await axiosInstance.get('/api/orders/all');
        }
      }
      
      if (response.data.success) {
        setOrders(response.data.orders || []);
      } else {
        throw new Error(response.data.message || 'Failed to fetch orders');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      showMessage('Error fetching orders: ' + (error.response?.data?.message || error.message), 'error');
      setOrders([]);
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

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      let response;
      try {
        response = await axiosInstance.put(`/api/admin/orders/${orderId}/status`, {
          status: newStatus
        });
      } catch (err) {
        // Try alternative endpoint
        response = await axiosInstance.put(`/api/orders/${orderId}/status`, {
          status: newStatus
        });
      }
      
      if (response.data.success) {
        showMessage('Order status updated successfully', 'success');
        setOrders(orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('Error updating order status: ' + (error.response?.data?.message || error.message), 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      confirmed: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444',
      completed: '#10b981'
    };
    return colors[status?.toLowerCase()] || '#9ca3af';
  };

  const getStatusClass = (status) => {
    const classes = {
      pending: 'pending',
      confirmed: 'confirmed',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled',
      completed: 'completed'
    };
    return classes[status?.toLowerCase()] || '';
  };

  const getOptionTypeClass = (optionType) => {
    const classes = {
      sell: 'purchase',
      rent: 'rental',
      donate: 'donation',
      free: 'donation'
    };
    return classes[optionType?.toLowerCase()] || 'purchase';
  };

  const getOptionTypeText = (optionType) => {
    const types = {
      sell: 'Purchase',
      rent: 'Rental',
      donate: 'Donation',
      free: 'Donation'
    };
    return types[optionType?.toLowerCase()] || optionType || 'Purchase';
  };

  const formatDate = (dateString) => {
    if (!dateString) return { date: 'N/A', time: 'N/A' };
    try {
      const date = new Date(dateString);
      return {
        date: date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        }),
        time: date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit'
        })
      };
    } catch (error) {
      return { date: 'Invalid', time: 'Invalid' };
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status?.toLowerCase() !== filter.toLowerCase()) return false;
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      order.id?.toString().includes(search) ||
      (order.user_name || order.customer_name || '').toLowerCase().includes(search) ||
      (order.user_email || order.customer_email || '').toLowerCase().includes(search)
    );
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status?.toLowerCase() === 'pending').length,
    confirmed: orders.filter(o => o.status?.toLowerCase() === 'confirmed').length,
    shipped: orders.filter(o => o.status?.toLowerCase() === 'shipped').length,
    delivered: orders.filter(o => o.status?.toLowerCase() === 'delivered' || o.status?.toLowerCase() === 'completed').length,
    cancelled: orders.filter(o => o.status?.toLowerCase() === 'cancelled').length,
    totalRevenue: orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-spinner"></div>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      {/* Header */}
      <div className="orders-header">
        <div className="header-left">
          <h1>Order Management</h1>
          <p>Track and manage all customer orders</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchOrders} className="refresh-btn">
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
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card pending-card">
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card delivered-card">
          <div className="stat-value">{stats.delivered}</div>
          <div className="stat-label">Completed</div>
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
            className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            Pending ({stats.pending})
          </button>
          <button 
            className={`filter-btn ${filter === 'confirmed' ? 'active' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            Confirmed ({stats.confirmed})
          </button>
          <button 
            className={`filter-btn ${filter === 'shipped' ? 'active' : ''}`}
            onClick={() => setFilter('shipped')}
          >
            Shipped ({stats.shipped})
          </button>
          <button 
            className={`filter-btn ${filter === 'delivered' ? 'active' : ''}`}
            onClick={() => setFilter('delivered')}
          >
            Completed ({stats.delivered})
          </button>
        </div>
        <div className="search-wrapper">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search by order ID, customer name, or email..."
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

      {/* Orders Table */}
      <div className="table-container">
        <div className="table-responsive">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Item Type</th>
                <th>Transaction</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="9" className="empty-state">
                    <div className="empty-content">
                      <div className="empty-icon">📦</div>
                      <p>No orders found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(order => {
                  const formattedDate = formatDate(order.created_at || order.order_date);
                  return (
                    <tr key={order.id}>
                      <td className="id-column">#{order.id}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{order.user_name || order.customer_name || 'Unknown'}</div>
                          <div className="customer-email">{order.user_email || order.customer_email || '—'}</div>
                        </div>
                      </td>
                      <td>
                        <span className="item-type">{order.item_type || 'Product'}</span>
                      </td>
                      <td>
                        <span className={`option-badge ${getOptionTypeClass(order.option_type)}`}>
                          {getOptionTypeText(order.option_type)}
                        </span>
                      </td>
                      <td className="quantity-column">
                        <span className="quantity-badge">{order.quantity || 1}</span>
                      </td>
                      <td className="amount-column">
                        <span className="amount-value">
                          ₹{(parseFloat(order.total_amount) || 0).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <div className="status-container">
                          <span className={`status-dot ${getStatusClass(order.status)}`}></span>
                          <span className={`status-text ${getStatusClass(order.status)}`}>
                            {order.status || 'pending'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="date-info">
                          <div className="date">{formattedDate.date}</div>
                          <div className="time">{formattedDate.time}</div>
                        </div>
                      </td>
                      <td>
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                          className="status-select"
                          style={{ borderColor: getStatusColor(order.status) }}
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
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
            Showing {filteredOrders.length} of {orders.length} orders
          </span>
        </div>
      </div>

      {/* Status Distribution */}
      {orders.length > 0 && (
        <div className="distribution-section">
          <h3>Order Status Distribution</h3>
          <div className="distribution-bars">
            <div className="distribution-item">
              <span className="dist-label">Pending</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill pending" 
                  style={{ width: stats.total > 0 ? `${(stats.pending / stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="dist-value">{stats.pending}</span>
            </div>
            <div className="distribution-item">
              <span className="dist-label">Confirmed</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill confirmed" 
                  style={{ width: stats.total > 0 ? `${(stats.confirmed / stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="dist-value">{stats.confirmed}</span>
            </div>
            <div className="distribution-item">
              <span className="dist-label">Shipped</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill shipped" 
                  style={{ width: stats.total > 0 ? `${(stats.shipped / stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="dist-value">{stats.shipped}</span>
            </div>
            <div className="distribution-item">
              <span className="dist-label">Completed</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill delivered" 
                  style={{ width: stats.total > 0 ? `${(stats.delivered / stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="dist-value">{stats.delivered}</span>
            </div>
            <div className="distribution-item">
              <span className="dist-label">Cancelled</span>
              <div className="progress-bar">
                <div 
                  className="progress-fill cancelled" 
                  style={{ width: stats.total > 0 ? `${(stats.cancelled / stats.total) * 100}%` : '0%' }}
                ></div>
              </div>
              <span className="dist-value">{stats.cancelled}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;