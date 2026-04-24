import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('http://localhost:5001/api/admin/dashboard');
      if (response.data.success) {
        setDashboardData(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="dashboard-error">
        <div className="error-icon">!</div>
        <h2>Unable to Load Data</h2>
        <p>There was an error loading the dashboard data.</p>
        <button onClick={fetchDashboardData} className="retry-btn">Try Again</button>
      </div>
    );
  }

  const { stats, recentOrders, lowStockItems } = dashboardData;

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Dashboard</h1>
          <p>Overview of platform performance</p>
        </div>
        <button onClick={fetchDashboardData} className="refresh-btn">
          Refresh
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-trend positive">+12%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💊</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalMedicines}</div>
            <div className="stat-label">Total Medicines</div>
          </div>
          <div className="stat-trend positive">+8%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏥</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEquipment}</div>
            <div className="stat-label">Total Equipment</div>
          </div>
          <div className="stat-trend positive">+5%</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📦</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalOrders}</div>
            <div className="stat-label">Total Orders</div>
          </div>
          <div className="stat-trend positive">+15%</div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Recent Orders */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <Link to="/admin/orders" className="view-link">
              View All <span className="link-arrow">→</span>
            </Link>
          </div>
          {recentOrders.length > 0 ? (
            <div className="orders-list">
              {recentOrders.map(order => (
                <div key={order.id} className="order-item">
                  <div className="order-info">
                    <span className="order-id">#{order.id}</span>
                    <span className="order-user">{order.user_name}</span>
                  </div>
                  <div className="order-details">
                    <span className={`order-status ${order.status}`}>
                      {order.status}
                    </span>
                    <span className="order-amount">${order.total_amount}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <p>No recent orders</p>
            </div>
          )}
        </div>

        {/* Low Stock Items */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Low Stock Items</h3>
            <Link to="/admin/medicines" className="view-link">
              Manage Stock <span className="link-arrow">→</span>
            </Link>
          </div>
          {lowStockItems.length > 0 ? (
            <div className="stock-list">
              {lowStockItems.map(item => (
                <div key={item.id} className="stock-item">
                  <div className="stock-info">
                    <span className="stock-name">{item.name}</span>
                    <span className="stock-type">{item.item_type}</span>
                  </div>
                  <div className="stock-quantity">
                    <span className={`stock-badge ${item.quantity < 5 ? 'critical' : 'warning'}`}>
                      {item.quantity} left
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>All items are well stocked</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Users Section */}
      {dashboardData.recentUsers && dashboardData.recentUsers.length > 0 && (
        <div className="recent-users">
          <div className="recent-users-header">
            <h3>Recent Users</h3>
            <Link to="/admin/users" className="view-link">
              View All <span className="link-arrow">→</span>
            </Link>
          </div>
          <div className="users-list">
            {dashboardData.recentUsers.slice(0, 4).map(user => (
              <div key={user.id} className="user-card">
                <div className="user-avatar">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
                <div className="user-date">
                  {new Date(user.created_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;