import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminAnalytics.css';

const AdminAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5001/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setAnalyticsData(response.data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRevenue = (orders) => {
    return orders ? orders.reduce((total, order) => total + (order.total_amount || 0), 0) : 0;
  };

  const getPopularItems = () => {
    return [
      { name: 'Paracetamol 500mg', type: 'medicine', orders: 45 },
      { name: 'Blood Pressure Monitor', type: 'equipment', orders: 32 },
      { name: 'Vitamin C 1000mg', type: 'medicine', orders: 28 },
      { name: 'Oxygen Concentrator', type: 'equipment', orders: 25 },
      { name: 'Ibuprofen 400mg', type: 'medicine', orders: 22 }
    ];
  };

  const getUserGrowthData = () => {
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      data: [120, 190, 300, 500, 700, 900]
    };
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#b76e2e',
      confirmed: '#2563eb',
      shipped: '#4a4a4a',
      delivered: '#2e7d32',
      cancelled: '#c62828'
    };
    return colors[status] || '#9ca3af';
  };

  if (loading) {
    return (
      <div className="analytics-loading">
        <div className="loading-spinner"></div>
        <p>Loading analytics data...</p>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="analytics-error">
        <div className="error-icon">!</div>
        <h2>Unable to Load Data</h2>
        <p>There was an error loading the analytics data.</p>
        <button onClick={fetchAnalyticsData} className="retry-btn">Try Again</button>
      </div>
    );
  }

  const popularItems = getPopularItems();
  const userGrowth = getUserGrowthData();
  const estimatedRevenue = calculateRevenue(analyticsData.recentOrders);
  const maxUserValue = Math.max(...userGrowth.data);

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <div className="header-left">
          <h1>Analytics & Reports</h1>
          <p>Track platform performance and user engagement</p>
        </div>
        <div className="header-actions">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-select"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="year">Last Year</option>
          </select>
          <button onClick={fetchAnalyticsData} className="refresh-btn">
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <span className="metric-value">${estimatedRevenue.toFixed(2)}</span>
            <span className="metric-label">Estimated Revenue</span>
          </div>
          <div className="metric-trend positive">+12.5%</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <span className="metric-value">{analyticsData.stats?.totalOrders || 0}</span>
            <span className="metric-label">Total Orders</span>
          </div>
          <div className="metric-trend positive">+8.3%</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <span className="metric-value">{analyticsData.stats?.totalUsers || 0}</span>
            <span className="metric-label">Total Users</span>
          </div>
          <div className="metric-trend positive">+15.2%</div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <span className="metric-value">
              {((analyticsData.stats?.totalOrders / Math.max(analyticsData.stats?.totalUsers || 1, 1)) * 100).toFixed(1)}%
            </span>
            <span className="metric-label">Conversion Rate</span>
          </div>
          <div className="metric-trend positive">+2.1%</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* Popular Items */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Most Popular Items</h3>
            <button className="export-btn">Export</button>
          </div>
          <div className="popular-items-list">
            {popularItems.map((item, index) => {
              const totalOrders = popularItems.reduce((sum, i) => sum + i.orders, 0);
              const percentage = (item.orders / totalOrders) * 100;
              return (
                <div key={index} className="popular-item">
                  <div className="item-rank">{index + 1}</div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-type">{item.type}</div>
                  </div>
                  <div className="item-stats">
                    <div className="item-orders">{item.orders} orders</div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="item-percentage">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Growth Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>User Growth</h3>
            <div className="chart-legend">
              <span className="legend-dot"></span>
              <span className="legend-text">New Users</span>
            </div>
          </div>
          <div className="growth-chart">
            <div className="chart-bars">
              {userGrowth.data.map((value, index) => (
                <div key={index} className="bar-wrapper">
                  <div 
                    className="bar"
                    style={{ 
                      height: `${(value / maxUserValue) * 140}px`
                    }}
                  >
                    <span className="bar-value">{value}</span>
                  </div>
                  <div className="bar-label">{userGrowth.labels[index]}</div>
                </div>
              ))}
            </div>
            <div className="chart-summary">
              <div className="summary-item">
                <span className="summary-label">Total Users</span>
                <span className="summary-value">{userGrowth.data[userGrowth.data.length - 1]}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Growth Rate</span>
                <span className="summary-value positive">+28.6%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Order Status Distribution</h3>
          </div>
          <div className="status-distribution">
            {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(status => {
              const count = analyticsData.recentOrders ? 
                analyticsData.recentOrders.filter(order => order.status === status).length : 0;
              const total = analyticsData.recentOrders ? analyticsData.recentOrders.length : 1;
              const percentage = (count / total) * 100;
              
              return (
                <div key={status} className="status-item">
                  <div className="status-header">
                    <div className="status-info">
                      <span className={`status-dot ${status}`}></span>
                      <span className="status-name">{status}</span>
                    </div>
                    <span className="status-count">{count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="status-progress">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: getStatusColor(status)
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="chart-card">
          <div className="chart-header">
            <h3>Quick Actions</h3>
          </div>
          <div className="quick-actions">
            <button className="action-btn">
              <span className="action-icon">📥</span>
              <div className="action-content">
                <span className="action-title">Export Orders Report</span>
                <span className="action-desc">Download CSV with order details</span>
              </div>
              <span className="action-arrow">→</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">👥</span>
              <div className="action-content">
                <span className="action-title">User Activity Report</span>
                <span className="action-desc">Analyze user engagement metrics</span>
              </div>
              <span className="action-arrow">→</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">📊</span>
              <div className="action-content">
                <span className="action-title">Sales Analytics</span>
                <span className="action-desc">View detailed sales performance</span>
              </div>
              <span className="action-arrow">→</span>
            </button>
            <button className="action-btn">
              <span className="action-icon">🏥</span>
              <div className="action-content">
                <span className="action-title">Inventory Report</span>
                <span className="action-desc">Check stock levels and reorder</span>
              </div>
              <span className="action-arrow">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;