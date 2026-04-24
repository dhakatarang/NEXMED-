// frontend/src/pages/SignUp.jsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import OTPVerification from '../components/OTPVerification';
import './SignUp.css';

function SignUp() {
    const [step, setStep] = useState('signup'); // 'signup' or 'otp'
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        userType: '',
        medicalLicense: null
    });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const navigate = useNavigate();

    const userTypes = [
        'Individual Donor / Receiver',
        'Healthcare Organization',
        'NGO',
        'Medical Supplier',
        'Community Partner',
        'Other'
    ];

    const requiresLicense = ['Healthcare Organization', 'Medical Supplier'];

    // Enhanced password validation
    const validatePassword = (password) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        
        return {
            isValid: password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar,
            minLength,
            hasUpperCase,
            hasLowerCase,
            hasNumbers,
            hasSpecialChar
        };
    };

    // Validation function
    const validateForm = () => {
        const newErrors = {};

        // Name validation
        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        } else if (formData.name.trim().length < 2) {
            newErrors.name = 'Name must be at least 2 characters';
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!formData.email) {
            newErrors.email = 'Email is required';
        } else if (!emailRegex.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // User Type validation
        if (!formData.userType) {
            newErrors.userType = 'Please select your user type';
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else {
            const passwordValidation = validatePassword(formData.password);
            if (!passwordValidation.isValid) {
                newErrors.password = 'Password does not meet requirements';
            }
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match';
        }

        // Medical License validation for specific user types
        if (requiresLicense.includes(formData.userType) && !formData.medicalLicense) {
            newErrors.medicalLicense = 'Medical license/certificate is required for this user type';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;
        
        if (type === 'file') {
            setFormData(prev => ({
                ...prev,
                [name]: files[0]
            }));
            // Clear error for file input
            if (errors[name]) {
                setErrors(prev => ({
                    ...prev,
                    [name]: ''
                }));
            }
        } else {
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
        }
    };

    // Function to send OTP
    const sendOTP = async () => {
        try {
            const response = await axios.post('https://nexmed.onrender.com/api/auth/send-otp', {
                email: formData.email.toLowerCase()
            });
            
            if (response.data.success) {
                return true;
            }
            return false;
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Failed to send OTP';
            if (error.response?.status === 400) {
                if (errorMsg.includes('already registered')) {
                    setErrors({ email: errorMsg });
                } else {
                    alert(errorMsg);
                }
            } else {
                alert('Failed to send OTP. Please check your email address.');
            }
            return false;
        }
    };

    // Modified handleSubmit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            // Scroll to first error
            const firstError = document.querySelector('.error-message');
            if (firstError) {
                firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        setIsLoading(true);

        try {
            // First, send OTP to email
            const otpSent = await sendOTP();
            if (otpSent) {
                // Move to OTP verification step
                setStep('otp');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Failed to initiate verification. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Function to handle OTP verification success
    const handleOTPVerified = async (isVerified) => {
        if (isVerified) {
            // Now proceed with actual signup
            setIsLoading(true);
            
            try {
                const submitData = new FormData();
                submitData.append('name', formData.name.trim());
                submitData.append('email', formData.email.toLowerCase());
                submitData.append('password', formData.password);
                submitData.append('userType', formData.userType);
                submitData.append('isEmailVerified', 'true');
                
                if (formData.medicalLicense) {
                    submitData.append('medicalLicense', formData.medicalLicense);
                }

                const res = await axios.post('https://nexmed.onrender.com/api/auth/signup', submitData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });

                if (res.data.success) {
                    alert('Registration successful! Please login with your credentials.');
                    navigate('/login');
                } else {
                    throw new Error(res.data.message || 'Registration failed');
                }
                
            } catch (err) {
                console.error('💥 Registration error:', err);
                const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
                alert(errorMessage);
                setStep('signup'); // Go back to signup form on error
            } finally {
                setIsLoading(false);
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const passwordValidation = formData.password ? validatePassword(formData.password) : null;

    // If in OTP step, show OTP verification
    if (step === 'otp') {
        return (
            <OTPVerification 
                email={formData.email}
                onVerified={handleOTPVerified}
                onBack={() => setStep('signup')}
            />
        );
    }

    // Signup form
    return (
        <div className="signup-container">
            <form onSubmit={handleSubmit} className="signup-form">
                <h2>Create Account</h2>
                
                {errors.general && (
                    <div className="error-message general-error" style={{textAlign: 'center', marginBottom: '16px'}}>
                        {errors.general}
                    </div>
                )}
                
                <div className="form-group">
                    <label htmlFor="name">Full Name *</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        className={errors.name ? 'error' : ''}
                        disabled={isLoading}
                    />
                    {errors.name && <span className="error-message">{errors.name}</span>}
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email address"
                        className={errors.email ? 'error' : ''}
                        disabled={isLoading}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                    <small className="form-hint">We'll send a verification code to this email</small>
                </div>

                <div className="form-group">
                    <label htmlFor="userType">I am a *</label>
                    <select
                        id="userType"
                        name="userType"
                        value={formData.userType}
                        onChange={handleChange}
                        className={errors.userType ? 'error' : ''}
                        disabled={isLoading}
                    >
                        <option value="">Select your role</option>
                        {userTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    {errors.userType && <span className="error-message">{errors.userType}</span>}
                </div>

                {requiresLicense.includes(formData.userType) && (
                    <div className="form-group">
                        <label htmlFor="medicalLicense">Upload Medical License / Registration Certificate *</label>
                        <input
                            type="file"
                            id="medicalLicense"
                            name="medicalLicense"
                            onChange={handleChange}
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            className={errors.medicalLicense ? 'error' : ''}
                            disabled={isLoading}
                        />
                        <small className="file-hint">Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max: 5MB)</small>
                        {errors.medicalLicense && <span className="error-message">{errors.medicalLicense}</span>}
                    </div>
                )}

                <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <div className="password-input-container">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="Create a strong password"
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
                    
                    {formData.password && (
                        <div className="password-strength">
                            <div className={`strength-indicator ${passwordValidation?.isValid ? 'strong' : 'weak'}`}>
                                {passwordValidation?.isValid ? '✓ Strong Password' : '⚠ Weak Password'}
                            </div>
                            <ul className="password-requirements">
                                <li className={formData.password.length >= 8 ? 'met' : ''}>
                                    {formData.password.length >= 8 ? '✓' : '○'} At least 8 characters
                                </li>
                                <li className={/[A-Z]/.test(formData.password) ? 'met' : ''}>
                                    {/[A-Z]/.test(formData.password) ? '✓' : '○'} One uppercase letter
                                </li>
                                <li className={/[a-z]/.test(formData.password) ? 'met' : ''}>
                                    {/[a-z]/.test(formData.password) ? '✓' : '○'} One lowercase letter
                                </li>
                                <li className={/\d/.test(formData.password) ? 'met' : ''}>
                                    {/\d/.test(formData.password) ? '✓' : '○'} One number
                                </li>
                                <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'met' : ''}>
                                    {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'} One special character
                                </li>
                            </ul>
                        </div>
                    )}
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password *</label>
                    <div className="password-input-container">
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            placeholder="Confirm your password"
                            className={errors.confirmPassword ? 'error' : ''}
                            disabled={isLoading}
                        />
                        <button 
                            type="button"
                            className="password-toggle"
                            onClick={toggleConfirmPasswordVisibility}
                            disabled={isLoading}
                        >
                            {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                    </div>
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                </div>

                <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isLoading}
                >
                    {isLoading ? 'Sending OTP...' : 'Sign Up'}
                </button>

                <p className="login-link">
                    Already have an account? <Link to="/login">Log in</Link>
                </p>
                
                <div className="terms-note">
                    <small>
                        By signing up, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>
                    </small>
                </div>
            </form>
        </div>
    );
}

export default SignUp;