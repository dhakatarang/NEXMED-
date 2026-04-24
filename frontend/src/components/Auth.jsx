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
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');

    try {
      const endpoint = isLogin ? 'http://localhost:5001/api/login' : 'http://localhost:5001/api/register';
      
      // Remove confirmPassword before sending
      const { confirmPassword, ...submitData } = formData;
      
      const response = await axios.post(endpoint, submitData);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // Trigger storage event for navbar update
        window.dispatchEvent(new Event('storage'));
        
        // Navigate to home page
        navigate('/home');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.response?.data?.error || err.response?.data?.message || 'Something went wrong');
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
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
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
              <button type="button" className="forgot-link">
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

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className="switch-btn"
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>

        {!isLogin && (
          <p className="terms-note">
            By creating an account, you agree to our{' '}
            <button type="button" className="terms-link">Terms of Service</button>
            {' '}and{' '}
            <button type="button" className="terms-link">Privacy Policy</button>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;