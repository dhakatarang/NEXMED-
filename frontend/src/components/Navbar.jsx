/*
  Navbar -> (navbar for Admin)
*/

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }

    const handleLoginChange = () => {
      const userData = localStorage.getItem('user');
      setUser(userData ? JSON.parse(userData) : null);
    };

    window.addEventListener('storage', handleLoginChange);
    window.addEventListener('loginStateChange', handleLoginChange);

    return () => {
      window.removeEventListener('storage', handleLoginChange);
      window.removeEventListener('loginStateChange', handleLoginChange);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.dispatchEvent(new Event('loginStateChange'));
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const closeDropdown = () => {
    setDropdownOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <div className="nav-logo">
          <Link to="/home" className="logo-link">
            <svg className="logo-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="logo-text">NexMed</span>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="mobile-toggle" onClick={toggleMobileMenu}>
          <span className={`toggle-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`toggle-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
          <span className={`toggle-bar ${mobileMenuOpen ? 'open' : ''}`}></span>
        </div>

        {/* Navigation Links */}
        <div className={`nav-links ${mobileMenuOpen ? 'active' : ''}`}>
          <Link 
            to="/home" 
            className={`nav-link ${isActiveRoute('/home') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M3 9L12 3L21 9L12 15L3 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Home</span>
          </Link>
          <Link 
            to="/medicines" 
            className={`nav-link ${isActiveRoute('/medicines') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 8V16M8 12H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Medicines</span>
          </Link>
          <Link 
            to="/medicalequipments" 
            className={`nav-link ${isActiveRoute('/medicalequipments') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M20 12H4M12 4V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            <span>Equipment</span>
          </Link>
          <Link 
            to="/donaterent" 
            className={`nav-link ${isActiveRoute('/donaterent') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L15 8H22L16 12L19 18L12 14L5 18L8 12L2 8H9L12 2Z" stroke="currentColor" strokeWidth="1.5" fill="currentColor" fillOpacity="0.2"/>
            </svg>
            <span>Donate/Rent</span>
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${isActiveRoute('/about') ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <svg className="nav-icon" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span>About</span>
          </Link>
        </div>

        {/* User Section */}
        <div className="nav-user">
          {user ? (
            <div className="user-menu">
              <button className="profile-icon-btn" onClick={toggleDropdown}>
                <svg className="user-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="1.5"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span className="user-name">{user.name || user.email}</span>
                <svg className={`chevron ${dropdownOpen ? 'rotate' : ''}`} viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
              
              {dropdownOpen && (
                <div className="dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      <svg className="dropdown-user-icon" viewBox="0 0 24 24" fill="none">
                        <path d="M20 21V19C20 16.8 18.2 15 16 15H8C5.8 15 4 16.8 4 19V21" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <div className="dropdown-info">
                      <p className="dropdown-name">{user.name || user.email}</p>
                      <p className="dropdown-email">{user.email}</p>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={closeDropdown}>
                    Profile
                  </Link>
                  <Link to="/cart" className="dropdown-item" onClick={closeDropdown}>
                    Cart
                  </Link>
                  {user.role === 'admin' && (
                    <Link to="/admin" className="dropdown-item" onClick={closeDropdown}>
                      Admin Panel
                    </Link>
                  )}
                  <div className="dropdown-divider"></div>
                  <button onClick={handleLogout} className="dropdown-item logout">
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="btn-login" onClick={closeMobileMenu}>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M15 3H19C19.5 3 20 3.5 20 4V20C20 20.5 19.5 21 19 21H15" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M10 17L15 12L10 7" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M15 12H3" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>Sign In</span>
              </Link>
              <Link to="/signup" className="btn-signup" onClick={closeMobileMenu}>
                <svg className="btn-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <span>Get Started</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Overlays */}
      {dropdownOpen && <div className="overlay" onClick={closeDropdown}></div>}
      {mobileMenuOpen && <div className="overlay" onClick={closeMobileMenu}></div>}
    </nav>
  );
};

export default Navbar;