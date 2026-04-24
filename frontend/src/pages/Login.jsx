// frontend/src/pages/Login.jsx


/*

    Login page -> (it is main Login Page)

*/


import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './SignUp.css'; // Using same CSS as SignUp

function Login({ setIsLoggedIn }) {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    return;
  }

  setIsLoading(true);

  try {
    console.log('📍 Sending login request to backend...');
    const res = await axios.post('https://nexmed.onrender.com/api/auth/login', {
      email: formData.email.toLowerCase(),
      password: formData.password
    });

    console.log('✅ Login successful:', res.data);
    
    // Store the actual JWT token from backend response
    if (res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      console.log('🔐 Token stored:', res.data.token);
      console.log('👤 User data stored:', res.data.user);
      console.log('🔑 User role:', res.data.user.role);
      
      // Update login state in App.jsx
      if (setIsLoggedIn) {
        setIsLoggedIn(true);
      }
      
      // Also dispatch custom event for App.jsx to catch
      window.dispatchEvent(new Event('loginStateChange'));
    }
    
    // AUTO-REDIRECT BASED ON ROLE
    if (res.data.user.role === 'admin') {
      console.log('🚀 Redirecting to ADMIN panel');
      navigate('/admin');
    } else {
      console.log('🏠 Redirecting to USER home');
      navigate('/home');
    }
    
  } catch (err) {
    console.error('💥 Login error:', err);
    console.error('💥 Error response:', err.response);
    
    // Enhanced error handling
    const errorMessage = err.response?.data?.error || 
                        err.response?.data?.message || 
                        'Login failed. Please try again.';
    
    if (err.response?.status === 401) {
      setErrors({ general: 'Invalid email or password' });
    } else {
      alert(errorMessage);
    }
  } finally {
    setIsLoading(false);
  }
};

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="signup-container">
            <form onSubmit={handleSubmit} className="signup-form">
                <h2>Login to Your Account</h2>
                
                {errors.general && (
                    <div className="error-message general-error" style={{textAlign: 'center', marginBottom: '16px'}}>
                        {errors.general}
                    </div>
                )}
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={errors.email ? 'error' : ''}
                        disabled={isLoading}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <div className="password-input-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            className={errors.password ? 'error' : ''}
                            disabled={isLoading}
                        />
                        <button 
                            type="button"
                            className="password-toggle"
                            onClick={togglePasswordVisibility}
                            disabled={isLoading}
                        >
                            {showPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Logging in...' : 'Login'}
                </button>

                <p className="login-link">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </form>
        </div>
    );
}

export default Login;