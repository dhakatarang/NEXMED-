import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    userType: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // ✅ Get base URL dynamically based on environment
  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return 'https://nexmed.onrender.com';
  };

  const BASE_URL = getBaseUrl();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!isLogin) {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.name.trim().length < 2) {
        setError('Please enter your full name');
        return false;
      }
    }
    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      // ✅ Use dynamic base URL for API calls
      const endpoint = isLogin 
        ? `${BASE_URL}/api/auth/login` 
        : `${BASE_URL}/api/auth/register`;
      
      // Remove confirmPassword before sending
      const { confirmPassword, ...submitData } = formData;
      
      console.log('Sending request to:', endpoint);
      console.log('Request data:', { ...submitData, password: '***' });
      
      const response = await axios.post(endpoint, submitData);
      
      console.log('Response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // ✅ Store user type for role-based routing
        if (response.data.user.userType) {
          localStorage.setItem('userType', response.data.user.userType);
        }
        
        // Trigger storage event for navbar update
        window.dispatchEvent(new Event('storage'));
        
        // ✅ Navigate to home page or dashboard based on user type
        if (response.data.user.userType === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      } else if (response.data.success) {
        // Handle case where token might be in different format
        if (response.data.user) {
          // If user data is returned but no token (should not happen)
          console.warn('No token received but login was successful');
          navigate('/home');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      
      // ✅ Better error messages
      if (err.response) {
        // Server responded with error status
        const errorMessage = err.response.data?.error || 
                           err.response.data?.message || 
                           err.response.data?.msg ||
                           'Authentication failed';
        setError(errorMessage);
        
        // Handle specific error cases
        if (err.response.status === 401) {
          setError('Invalid email or password');
        } else if (err.response.status === 409) {
          setError('User already exists. Please login instead.');
        } else if (err.response.status === 400) {
          setError('Please check your input and try again');
        }
      } else if (err.request) {
        // Request was made but no response
        setError('Cannot connect to server. Please check if backend is running.');
      } else {
        // Something else happened
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to handle demo login for testing
  const handleDemoLogin = async (userType = 'user') => {
    setLoading(true);
    setError('');
    
    try {
      let email, password;
      switch(userType) {
        case 'admin':
          email = 'admin@nexmed.com';
          password = 'admin123';
          break;
        case 'donor':
          email = 'donor@nexmed.com';
          password = 'donor123';
          break;
        default:
          email = 'user@nexmed.com';
          password = 'user123';
      }
      
      const response = await axios.post(`${BASE_URL}/api/auth/login`, {
        email,
        password
      });
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        window.dispatchEvent(new Event('storage'));
        navigate('/home');
      }
    } catch (err) {
      setError('Demo login failed. Please try regular login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
          <p>{isLogin ? 'Sign in to continue to NexMed' : 'Join our healthcare community'}</p>
        </div>

        {error && (
          <div className="auth-error">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="userType">I am a</label>
                <select
                  id="userType"
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  disabled={loading}
                  className="form-select"
                >
                  <option value="user">Patient / Individual</option>
                  <option value="donor">Donor</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="hospital">Hospital</option>
                </select>
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isLogin ? 'Enter your password' : 'Create a password (min. 6 characters)'}
                required
                minLength="6"
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                minLength="6"
                disabled={loading}
              />
            </div>
          )}

          {isLogin && (
            <div className="forgot-password">
              <button type="button" className="forgot-link" onClick={() => alert('Please contact support to reset your password')}>
                Forgot password?
              </button>
            </div>
          )}

          <button 
            type="submit" 
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading-spinner"></span>
                <span>Processing...</span>
              </>
            ) : (
              isLogin ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        {/* ✅ Demo Login Buttons for Testing */}
        {isLogin && process.env.NODE_ENV !== 'production' && (
          <div className="demo-login">
            <div className="demo-divider">
              <span>Or try demo accounts</span>
            </div>
            <div className="demo-buttons">
              <button 
                type="button" 
                className="demo-btn user"
                onClick={() => handleDemoLogin('user')}
                disabled={loading}
              >
                Demo User
              </button>
              <button 
                type="button" 
                className="demo-btn donor"
                onClick={() => handleDemoLogin('donor')}
                disabled={loading}
              >
                Demo Donor
              </button>
              <button 
                type="button" 
                className="demo-btn admin"
                onClick={() => handleDemoLogin('admin')}
                disabled={loading}
              >
                Demo Admin
              </button>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className="switch-btn"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(''); // Clear error when switching
              }}
              disabled={loading}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {!isLogin && (
          <p className="terms-note">
            By creating an account, you agree to our{' '}
            <button type="button" className="terms-link" onClick={() => alert('Terms of Service')}>
              Terms of Service
            </button>
            {' '}and{' '}
            <button type="button" className="terms-link" onClick={() => alert('Privacy Policy')}>
              Privacy Policy
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;