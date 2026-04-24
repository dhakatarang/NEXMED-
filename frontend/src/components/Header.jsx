/*

  Navbar -> (Navbar for user)

*/

import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ user, logout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      // Fallback logout logic
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.dispatchEvent(new Event('storage'));
      navigate('/login');
    }
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <Link to="/" className="logo-link">
            NexMed
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="header-nav">
          <Link 
            to="/" 
            className={`nav-link ${isActiveRoute('/') ? 'active' : ''}`}
          >
            Home
          </Link>
          <Link 
            to="/medicines" 
            className={`nav-link ${isActiveRoute('/medicines') ? 'active' : ''}`}
          >
            Medicines
          </Link>
          <Link 
            to="/medicalequipments" 
            className={`nav-link ${isActiveRoute('/medicalequipments') ? 'active' : ''}`}
          >
            Equipment
          </Link>
          <Link 
            to="/donaterent" 
            className={`nav-link ${isActiveRoute('/donaterent') ? 'active' : ''}`}
          >
            Donate/Rent
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActiveRoute('/about') ? 'active' : ''}`}
          >
            About
          </Link>
        </nav>

        {/* User Section */}
        <div className="header-user">
          {user ? (
            <div className="user-menu">
              <span className="user-name">
                {user.name || user.email}
                {user.role === 'admin' && <span className="admin-badge">●</span>}
              </span>
              <div className="user-dropdown">
                <Link to="/profile" className="dropdown-item">
                  Profile
                </Link>
                <Link to="/cart" className="dropdown-item">
                  Cart
                </Link>
                {user.role === 'admin' && (
                  <Link to="/dashboard" className="dropdown-item admin">
                    Dashboard
                  </Link>
                )}
                <div className="dropdown-divider"></div>
                <button 
                  onClick={handleLogout}
                  className="dropdown-item logout"
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="auth-link login">
                Login
              </Link>
              <Link to="/signup" className="auth-link signup">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;