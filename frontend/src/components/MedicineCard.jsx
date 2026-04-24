import React from 'react';
import { useNavigate } from 'react-router-dom';
import './MedicineCard.css';

const MedicineCard = ({ medicine }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const calculateDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = () => {
    if (!medicine.expiryDate) return null;
    
    const daysUntil = calculateDaysUntilExpiry(medicine.expiryDate);
    
    if (daysUntil < 0) return 'expired';
    if (daysUntil <= 60) return 'expiring-soon';
    return 'valid';
  };

  const expiryStatus = getExpiryStatus();
  const daysUntil = calculateDaysUntilExpiry(medicine.expiryDate);

  const getStatusText = () => {
    if (!expiryStatus) return null;
    
    if (expiryStatus === 'expired') {
      return `Expired ${Math.abs(daysUntil)} days ago`;
    }
    if (expiryStatus === 'expiring-soon') {
      return `Expires in ${daysUntil} days`;
    }
    return `Valid until ${formatDate(medicine.expiryDate)}`;
  };

  // FIXED: Function to get the correct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // If it's already an external URL (starts with http or https)
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // If it's a local path (starts with /uploads or similar)
    if (imagePath.startsWith('/')) {
      return `https://nexmed.onrender.com${imagePath}`;
    }
    
    // Fallback for relative paths
    return `https://nexmed.onrender.com/uploads/${imagePath}`;
  };

  const handleClick = () => {
    if (medicine.id) {
      navigate(`/medicines/${medicine.id}`);
    }
  };

  return (
    <div 
      className={`medicine-card ${expiryStatus || ''}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyPress={(e) => e.key === 'Enter' && handleClick()}
    >
      <div className="card-image-container">
        {/* FIXED: Image handling with correct URL function */}
        {medicine.image_path || medicine.imageUrl ? (
          <img 
            src={getImageUrl(medicine.image_path || medicine.imageUrl)} 
            alt={medicine.name || 'Medicine'}
            className="card-image"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentNode.classList.add('image-fallback');
              // Show emoji placeholder on error
              e.target.parentNode.innerHTML = '<div class="image-placeholder">💊</div>';
            }}
          />
        ) : (
          <div className="image-placeholder">💊</div>
        )}
        
        {expiryStatus && (
          <div className={`status-badge ${expiryStatus}`}>
            {expiryStatus === 'expired' && 'Expired'}
            {expiryStatus === 'expiring-soon' && 'Expiring Soon'}
            {expiryStatus === 'valid' && 'Valid'}
          </div>
        )}
      </div>

      <div className="card-content">
        <h3 className="medicine-name">{medicine.name || 'Unnamed Medicine'}</h3>
        
        <div className="medicine-details">
          {medicine.batchNumber && (
            <div className="detail-item">
              <span className="detail-label">Batch No.</span>
              <span className="detail-value">{medicine.batchNumber}</span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="detail-label">Price</span>
            <span className="detail-value">
              {medicine.price === 0 ? 'Free' : `$${medicine.price}`}
            </span>
          </div>
          
          {medicine.quantity && (
            <div className="detail-item">
              <span className="detail-label">Stock</span>
              <span className="detail-value">{medicine.quantity} units</span>
            </div>
          )}
          
          {medicine.expiryDate && (
            <div className="detail-item expiry">
              <span className="detail-label">Expiry</span>
              <span className={`detail-value ${expiryStatus}`}>
                {formatDate(medicine.expiryDate)}
              </span>
            </div>
          )}
        </div>

        {expiryStatus && (
          <div className={`expiry-message ${expiryStatus}`}>
            <span className="message-icon">
              {expiryStatus === 'expired' && '⚠️'}
              {expiryStatus === 'expiring-soon' && '⏰'}
              {expiryStatus === 'valid' && '✓'}
            </span>
            <span className="message-text">{getStatusText()}</span>
          </div>
        )}

        {medicine.option_type && (
          <div className={`option-badge ${medicine.option_type}`}>
            {medicine.option_type === 'donate' && 'Free Donation'}
            {medicine.option_type === 'sell' && 'For Sale'}
            {medicine.option_type === 'rent' && 'For Rent'}
            {medicine.option_type === 'both' && 'Sale & Rent'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineCard;