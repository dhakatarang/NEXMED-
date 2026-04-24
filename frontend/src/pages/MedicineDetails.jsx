/*
  Medicine-Details Section -> (When user click on particular medicine to add to cart or see it's details)
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MedicineDetails.css';

const MedicineDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [medicine, setMedicine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    fetchMedicineDetails();
  }, [id]);

  const fetchMedicineDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:5001/api/medicines/${id}`);
      
      if (response.data.success) {
        const medicineData = {
          id: response.data.medicine.id || 0,
          name: response.data.medicine.name || 'Unnamed Medicine',
          description: response.data.medicine.description || 'No description available',
          quantity: response.data.medicine.quantity || 0,
          price: response.data.medicine.price || 0,
          optionType: response.data.medicine.optionType || response.data.medicine.option_type || 'donate',
          image: response.data.medicine.image || response.data.medicine.image_path || null,
          expiryDate: response.data.medicine.expiry_date || null,
          manufacturer: response.data.medicine.manufacturer || 'Unknown',
          batchNumber: response.data.medicine.batch_number || '',
          dosage: response.data.medicine.dosage || '',
          salt: response.data.medicine.salt || '',
          requiresPrescription: response.data.medicine.requires_prescription || false
        };
        
        setMedicine(medicineData);
      } else {
        showMessage('Medicine not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching medicine details:', error);
      showMessage('Error loading medicine details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const handlePurchase = async () => {
    if (!medicine) return;
    
    try {
      setMessage('');
      const response = await axios.post(`http://localhost:5001/api/medicines/buy/${id}`, {
        quantity: quantity
      });

      if (response.data.success) {
        showMessage('Purchase successful!', 'success');
        setMedicine(prev => ({
          ...prev,
          quantity: response.data.remainingQuantity
        }));
        
        setTimeout(() => {
          navigate('/medicines');
        }, 2000);
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error purchasing medicine', 'error');
    }
  };

  const handleAddToCart = async () => {
    if (!medicine) return;
    
    try {
      setMessage('');
      const response = await axios.post('http://localhost:5001/api/cart/add', {
        itemId: medicine.id,
        itemType: 'medicine',
        name: medicine.name,
        description: medicine.description,
        quantity: quantity,
        price: medicine.price,
        rentPrice: 0,
        optionType: medicine.optionType,
        image: medicine.image,
        rentalDays: 0
      });

      if (response.data.success) {
        showMessage('Item added to cart successfully!', 'success');
        setTimeout(() => {
          navigate('/cart');
        }, 1500);
      }
    } catch (error) {
      showMessage(error.response?.data?.message || 'Error adding to cart', 'error');
    }
  };

  const getMedicineIcon = () => {
    return '💊';
  };

  const getExpiryStatus = () => {
    // Check if medicine exists and has expiryDate
    if (!medicine || !medicine.expiryDate) return null;
    
    const today = new Date();
    const expiry = new Date(medicine.expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: 'Expired', class: 'expired' };
    if (diffDays <= 30) return { text: 'Expiring Soon', class: 'expiring-soon' };
    return { text: 'Valid', class: 'valid' };
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="medicine-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading medicine details...</p>
      </div>
    );
  }

  if (!medicine) {
    return (
      <div className="medicine-details-error">
        <div className="error-icon">⚠️</div>
        <h2>Medicine Not Found</h2>
        <p>The medicine you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/medicines')} className="error-back-btn">
          ← Back to Medicines
        </button>
      </div>
    );
  }

  const expiryStatus = getExpiryStatus();
  const calculateTotal = () => {
    if (medicine.optionType === 'sell') {
      return (medicine.price * quantity).toFixed(2);
    }
    return 0;
  };

  return (
    <div className="medicine-details-modern">
      {/* Back Button */}
      <div className="details-back">
        <button onClick={() => navigate('/medicines')} className="back-btn">
          <span className="back-icon">←</span>
          <span>Back to Medicines</span>
        </button>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`details-toast ${messageType}`}>
          <span className="toast-icon">{messageType === 'success' ? '✓' : '!'}</span>
          <span>{message}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="medicine-details-container">
        {/* Image Section */}
        <div className="details-image-section">
          <div className="image-card">
            {medicine.image ? (
              <img 
                src={`http://localhost:5001/uploads/${medicine.image}`} 
                alt={medicine.name}
                className="details-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('image-fallback');
                }}
              />
            ) : (
              <div className="image-placeholder">
                <span className="placeholder-icon">{getMedicineIcon()}</span>
              </div>
            )}
          </div>
          
          <div className="image-info">
            <div className="info-item">
              <span className="info-label">Availability</span>
              <span className={`info-value ${medicine.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {medicine.quantity > 0 ? `${medicine.quantity} in stock` : 'Out of stock'}
              </span>
            </div>
            {expiryStatus && (
              <div className="info-item">
                <span className="info-label">Expiry</span>
                <span className={`info-value ${expiryStatus.class}`}>
                  {expiryStatus.text}
                  {medicine.expiryDate && (
                    <span className="expiry-date">{formatDate(medicine.expiryDate)}</span>
                  )}
                </span>
              </div>
            )}
            {medicine.manufacturer !== 'Unknown' && (
              <div className="info-item">
                <span className="info-label">Manufacturer</span>
                <span className="info-value">{medicine.manufacturer}</span>
              </div>
            )}
            {medicine.batchNumber && (
              <div className="info-item">
                <span className="info-label">Batch No.</span>
                <span className="info-value">{medicine.batchNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="details-info-section">
          <div className="info-header">
            <h1 className="details-title">{medicine.name}</h1>
            <span className={`details-type ${medicine.optionType}`}>
              {medicine.optionType}
            </span>
          </div>
          
          <p className="details-description">{medicine.description}</p>

          {/* Additional Info */}
          {(medicine.salt || medicine.dosage) && (
            <div className="additional-info">
              {medicine.salt && (
                <div className="info-row">
                  <span className="info-row-label">Composition:</span>
                  <span className="info-row-value">{medicine.salt}</span>
                </div>
              )}
              {medicine.dosage && (
                <div className="info-row">
                  <span className="info-row-label">Dosage:</span>
                  <span className="info-row-value">{medicine.dosage}</span>
                </div>
              )}
              {medicine.requiresPrescription && (
                <div className="info-row prescription">
                  <span className="info-row-label">℞</span>
                  <span className="info-row-value">Prescription Required</span>
                </div>
              )}
            </div>
          )}

          {/* Pricing Card */}
          {medicine.optionType === 'sell' && medicine.price > 0 && (
            <div className="pricing-card">
              <div className="price-card">
                <span className="price-label">Price per unit</span>
                <span className="price-value">₹{medicine.price}</span>
              </div>
            </div>
          )}

          {/* Action Section */}
          {medicine.quantity > 0 ? (
            <div className="action-section">
              <h3>Select Options</h3>
              
              <div className="action-controls">
                <div className="control-group">
                  <label htmlFor="quantity">Quantity</label>
                  <div className="input-wrapper">
                    <input
                      id="quantity"
                      type="number"
                      min="1"
                      max={medicine.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, medicine.quantity))}
                    />
                    <span className="input-hint">Max: {medicine.quantity}</span>
                  </div>
                </div>
              </div>

              {/* Price Summary */}
              {medicine.optionType === 'sell' && (
                <div className="price-summary">
                  <div className="summary-row">
                    <span>Total Amount</span>
                    <span className="summary-total">₹{calculateTotal()}</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                {medicine.optionType === 'donate' ? (
                  <button 
                    onClick={handlePurchase}
                    disabled={quantity > medicine.quantity || quantity < 1}
                    className="action-primary donate"
                  >
                    Get {quantity} Free
                  </button>
                ) : (
                  <button 
                    onClick={handlePurchase}
                    disabled={quantity > medicine.quantity || quantity < 1}
                    className="action-primary sell"
                  >
                    Buy {quantity} - ₹{calculateTotal()}
                  </button>
                )}
                
                <button 
                  onClick={handleAddToCart}
                  disabled={quantity > medicine.quantity || quantity < 1}
                  className="action-secondary"
                >
                  <span className="btn-icon">🛒</span>
                  Add to Cart
                </button>
              </div>
            </div>
          ) : (
            <div className="out-of-stock-section">
              <span className="out-icon">⚠️</span>
              <h3>Out of Stock</h3>
              <p>This medicine is currently unavailable.</p>
              <button 
                onClick={() => navigate('/medicines')}
                className="browse-btn"
              >
                Browse Other Medicines
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicineDetails;