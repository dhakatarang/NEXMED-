import React from 'react';
import './ExpiryBadge.css';

const ExpiryBadge = ({ expiryDate }) => {
  const getExpiryStatus = () => {
    if (!expiryDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { 
        text: 'Expired', 
        icon: '❌', 
        class: 'expired',
        message: 'This medicine has expired'
      };
    } else if (daysUntilExpiry <= 7) {
      return { 
        text: `Expires in ${daysUntilExpiry} days`, 
        icon: '🔴', 
        class: 'critical',
        message: `Expires in ${daysUntilExpiry} days - Order soon!`
      };
    } else if (daysUntilExpiry <= 30) {
      const weeks = Math.ceil(daysUntilExpiry / 7);
      return { 
        text: `${weeks} week${weeks > 1 ? 's' : ''} left`, 
        icon: '🟡', 
        class: 'warning',
        message: `Expires in ${daysUntilExpiry} days`
      };
    } else {
      const months = Math.floor(daysUntilExpiry / 30);
      return { 
        text: `${months}+ months left`, 
        icon: '🟢', 
        class: 'good',
        message: `Expires in ${months} months`
      };
    }
  };

  const status = getExpiryStatus();
  if (!status) return null;

  return (
    <div className={`expiry-badge ${status.class}`} title={status.message}>
      <span className="expiry-icon">{status.icon}</span>
      <span className="expiry-text">{status.text}</span>
    </div>
  );
};

export default ExpiryBadge;