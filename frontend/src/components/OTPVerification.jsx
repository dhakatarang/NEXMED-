import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './OTPVerification.css';

function OTPVerification({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  useEffect(() => {
    let interval;
    if (timer > 0 && !canResend) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [timer, canResend]);

  const handleChange = (index, value) => {
    if (value && !/^\d*$/.test(value)) return;
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'v' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const pastedText = e.clipboardData?.getData('text');
      if (pastedText && /^\d{6}$/.test(pastedText)) {
        const digits = pastedText.split('');
        setOtp(digits);
        inputRefs.current[5]?.focus();
      }
    }
  };

  const handleVerify = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // ✅ FIXED: Use Render backend URL
      const response = await axios.post('https://nexmed.onrender.com/api/auth/verify-otp', {
        email,
        otp: otpValue,
        purpose: 'signup'
      });

      if (response.data.success) {
        onVerified(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    setError('');

    try {
      // ✅ FIXED: Use Render backend URL
      await axios.post('https://nexmed.onrender.com/api/auth/resend-otp', { 
        email,
        purpose: 'signup'
      });
      setTimer(60);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      setError('');
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <div className="otp-verification-card">
        <h3>Verify Your Email</h3>
        <p className="otp-description">
          We've sent a 6-digit verification code to <strong>{email}</strong>
        </p>
        
        <div className="otp-inputs">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              inputMode="numeric"
              pattern="\d*"
              maxLength="1"
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="otp-input"
              disabled={isLoading}
            />
          ))}
        </div>

        {error && <div className="otp-error">{error}</div>}

        <button
          type="button"
          onClick={handleVerify}
          className="verify-otp-button"
          disabled={isLoading}
        >
          {isLoading ? 'Verifying...' : 'Verify OTP'}
        </button>

        <div className="otp-footer">
          {!canResend ? (
            <p className="timer-text">
              Resend code in <span className="timer">{timer}</span> seconds
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              className="resend-button"
              disabled={isLoading}
            >
              Resend OTP
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          className="back-to-signup"
          disabled={isLoading}
        >
          ← Back to Sign Up
        </button>
      </div>
    </div>
  );
}

export default OTPVerification;