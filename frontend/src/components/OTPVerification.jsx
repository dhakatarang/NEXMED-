// frontend/src/components/OTPVerification.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './OTPVerification.css';

// ✅ Add dynamic base URL (same as SignUp.jsx)
const getBaseUrl = () => {
  const hostname = window.location.hostname;
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
  
  if (isLocal) {
    return 'http://localhost:5001/api';
  }
  return 'https://nexmed-backend.onrender.com/api';
};

const OTPVerification = ({ email, onVerified, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);

  const BASE_URL = getBaseUrl();

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    
    if (otpValue.length !== 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      console.log(`📍 Verifying OTP at: ${BASE_URL}/auth/verify-otp`);
      
      const response = await axios.post(`${BASE_URL}/auth/verify-otp`, {
        email: email,
        otp: otpValue,
        purpose: 'signup'
      });

      if (response.data.success) {
        onVerified(true);
      } else {
        setError(response.data.message || 'Invalid verification code');
        onVerified(false);
      }
    } catch (error) {
      console.error('❌ OTP verification error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to verify OTP. Please try again.';
      setError(errorMsg);
      onVerified(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError('');

    try {
      console.log(`📍 Resending OTP to: ${BASE_URL}/auth/send-otp`);
      
      const response = await axios.post(`${BASE_URL}/auth/send-otp`, {
        email: email,
        purpose: 'signup'
      });

      if (response.data.success) {
        setTimeLeft(300);
        setCanResend(false);
        setOtp(['', '', '', '', '', '']);
        // Start timer again
        const timer = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              setCanResend(true);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        alert('New verification code sent!');
      } else {
        setError(response.data.message || 'Failed to resend code');
      }
    } catch (error) {
      console.error('❌ Resend error:', error);
      setError('Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <h2>Verify Your Email</h2>
        
        <p className="otp-description">
          We've sent a 6-digit verification code to
          <br />
          <strong>{email}</strong>
        </p>

        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyPress={handleKeyPress}
              className={error ? 'error' : ''}
              disabled={isLoading}
              autoFocus={index === 0}
            />
          ))}
        </div>

        {error && <div className="otp-error">{error}</div>}

        <div className="otp-timer">
          {timeLeft > 0 ? (
            <span>Code expires in: {formatTime(timeLeft)}</span>
          ) : (
            <span>Code expired</span>
          )}
        </div>

        <button 
          onClick={handleVerify} 
          className="verify-button"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify & Continue'}
        </button>

        <div className="resend-section">
          {canResend ? (
            <button onClick={handleResend} className="resend-button">
              Resend Code
            </button>
          ) : (
            <span className="resend-disabled">
              Resend available in {formatTime(timeLeft)}
            </span>
          )}
        </div>

        <button onClick={onBack} className="back-button">
          ← Back to Sign Up
        </button>
      </div>
    </div>
  );
};

export default OTPVerification;