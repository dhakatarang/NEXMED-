/*
  MedicineEquipment-Details Section -> (When user click on particular medicineEquipment to add to cart or see it's details)
*/

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MedicalEquipmentDetails.css';

const MedicalEquipmentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [rentalDays, setRentalDays] = useState(1);

  useEffect(() => {
    fetchEquipmentDetails();
  }, [id]);

  const fetchEquipmentDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`https://nexmed.onrender.com/api/equipments/${id}`);
      
      if (response.data.success) {
        const equipmentData = {
          id: response.data.equipment.id || 0,
          name: response.data.equipment.name || 'Unnamed Equipment',
          description: response.data.equipment.description || 'No description available',
          quantity: response.data.equipment.quantity || 0,
          price: response.data.equipment.price || 0,
          rentPrice: response.data.equipment.rentPrice || response.data.equipment.rent_price || 0,
          optionType: response.data.equipment.optionType || response.data.equipment.option_type || 'donate',
          image: response.data.equipment.image || response.data.equipment.image_path || null,
          duration: response.data.equipment.duration || response.data.equipment.min_rental_days || 0,
          condition: response.data.equipment.condition || 'good'
        };
        
        setEquipment(equipmentData);
        setRentalDays(Math.max(equipmentData.duration || 1, 1));
      } else {
        showMessage('Equipment not found', 'error');
      }
    } catch (error) {
      console.error('Error fetching equipment details:', error);
      showMessage('Error loading equipment details', 'error');
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

  const handleAction = async (action) => {
    try {
      setMessage('');
      
      const payload = {
        action: action,
        quantity: quantity
      };

      if (action === 'rent' && equipment.optionType === 'rent') {
        payload.rentalDays = rentalDays;
      }

      const response = await axios.post(`https://nexmed.onrender.com/api/equipments/action/${id}`, payload);

      if (response.data.success) {
        showMessage(`${action.charAt(0).toUpperCase() + action.slice(1)} successful!`, 'success');
        setEquipment(prev => ({
          ...prev,
          quantity: response.data.remainingQuantity
        }));
        
        setTimeout(() => {
          navigate('/medicalequipments');
        }, 2000);
      }
    } catch (error) {
      showMessage(error.response?.data?.message || `Error during ${action}`, 'error');
    }
  };

  const handleAddToCart = async () => {
    try {
      setMessage('');
      const response = await axios.post('https://nexmed.onrender.com/api/cart/add', {
        itemId: equipment.id,
        itemType: 'medicalequipment',
        name: equipment.name,
        description: equipment.description,
        quantity: quantity,
        price: equipment.price,
        rentPrice: equipment.rentPrice,
        optionType: equipment.optionType,
        image: equipment.image,
        rentalDays: equipment.optionType === 'rent' ? rentalDays : 0
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

  const getEquipmentIcon = (equipmentName) => {
    const name = equipmentName?.toLowerCase() || '';
    if (name.includes('wheelchair')) return '♿';
    if (name.includes('bed')) return '🛏️';
    if (name.includes('walker')) return '🚶';
    if (name.includes('oxygen')) return '💨';
    if (name.includes('monitor')) return '📊';
    if (name.includes('crutch')) return '🩼';
    if (name.includes('stethoscope')) return '🩺';
    return '⚕️';
  };

  const getActionButtonText = () => {
    if (!equipment) return '';
    
    const total = equipment.optionType === 'rent' 
      ? (equipment.rentPrice * rentalDays * quantity).toFixed(2)
      : (equipment.price * quantity).toFixed(2);
    
    switch (equipment.optionType) {
      case 'donate':
        return `Get ${quantity} Free`;
      case 'sell':
        return `Buy ${quantity} - ₹${total}`;
      case 'rent':
        return `Rent ${quantity} for ${rentalDays} days - ₹${total}`;
      default:
        return 'Take Action';
    }
  };

  const calculateTotal = () => {
    if (!equipment) return 0;
    if (equipment.optionType === 'rent') {
      return (equipment.rentPrice * rentalDays * quantity).toFixed(2);
    } else if (equipment.optionType === 'sell') {
      return (equipment.price * quantity).toFixed(2);
    }
    return 0;
  };

  if (loading) {
    return (
      <div className="equipment-details-loading">
        <div className="loading-spinner"></div>
        <p>Loading equipment details...</p>
      </div>
    );
  }

  if (!equipment) {
    return (
      <div className="equipment-details-error">
        <div className="error-icon">⚠️</div>
        <h2>Equipment Not Found</h2>
        <p>The equipment you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/medicalequipments')} className="error-back-btn">
          ← Back to Equipment
        </button>
      </div>
    );
  }

  return (
    <div className="equipment-details-modern">
      {/* Back Button */}
      <div className="details-back">
        <button onClick={() => navigate('/medicalequipments')} className="back-btn">
          <span className="back-icon">←</span>
          <span>Back to Medical Equipment</span>
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
      <div className="details-container">
        {/* Image Section */}
        <div className="details-image-section">
          <div className="image-card">
            {equipment.image ? (
              <img 
                src={`https://nexmed.onrender.com/uploads/${equipment.image}`} 
                alt={equipment.name}
                className="details-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentNode.classList.add('image-fallback');
                }}
              />
            ) : (
              <div className="image-placeholder">
                <span className="placeholder-icon">{getEquipmentIcon(equipment.name)}</span>
              </div>
            )}
          </div>
          
          <div className="image-info">
            <div className="info-item">
              <span className="info-label">Condition</span>
              <span className="info-value">{equipment.condition}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Availability</span>
              <span className={`info-value ${equipment.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                {equipment.quantity > 0 ? `${equipment.quantity} in stock` : 'Out of stock'}
              </span>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="details-info-section">
          <div className="info-header">
            <h1 className="details-title">{equipment.name}</h1>
            <span className={`details-type ${equipment.optionType}`}>
              {equipment.optionType}
            </span>
          </div>
          
          <p className="details-description">{equipment.description}</p>

          {/* Pricing Cards */}
          <div className="pricing-cards">
            {equipment.optionType === 'sell' && equipment.price > 0 && (
              <div className="price-card">
                <span className="price-label">Price</span>
                <span className="price-value">₹{equipment.price}</span>
              </div>
            )}
            
            {equipment.optionType === 'rent' && equipment.rentPrice > 0 && (
              <>
                <div className="price-card">
                  <span className="price-label">Daily Rent</span>
                  <span className="price-value rent">₹{equipment.rentPrice}</span>
                </div>
                {equipment.duration > 0 && (
                  <div className="price-card">
                    <span className="price-label">Min. Rental</span>
                    <span className="price-value">{equipment.duration} days</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Action Section */}
          {equipment.quantity > 0 ? (
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
                      max={equipment.quantity}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.min(parseInt(e.target.value) || 1, equipment.quantity))}
                    />
                    <span className="input-hint">Max: {equipment.quantity}</span>
                  </div>
                </div>

                {equipment.optionType === 'rent' && (
                  <div className="control-group">
                    <label htmlFor="rentalDays">Rental Days</label>
                    <div className="input-wrapper">
                      <input
                        id="rentalDays"
                        type="number"
                        min={equipment.duration || 1}
                        max="365"
                        value={rentalDays}
                        onChange={(e) => setRentalDays(Math.max(parseInt(e.target.value) || 1, equipment.duration || 1))}
                      />
                      {equipment.duration > 0 && (
                        <span className="input-hint">Min: {equipment.duration} days</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Price Summary */}
              {equipment.optionType !== 'donate' && (
                <div className="price-summary">
                  <div className="summary-row">
                    <span>Total Amount</span>
                    <span className="summary-total">₹{calculateTotal()}</span>
                  </div>
                  {equipment.optionType === 'rent' && (
                    <div className="summary-row small">
                      <span>{quantity} item(s) × {rentalDays} days</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="action-buttons">
                <button 
                  onClick={() => handleAction(
                    equipment.optionType === 'donate' ? 'get' : 
                    equipment.optionType === 'sell' ? 'buy' : 'rent'
                  )}
                  disabled={
                    quantity > equipment.quantity || 
                    quantity < 1 ||
                    (equipment.optionType === 'rent' && rentalDays < (equipment.duration || 1))
                  }
                  className={`action-primary ${equipment.optionType}`}
                >
                  {getActionButtonText()}
                </button>
                
                <button 
                  onClick={handleAddToCart}
                  disabled={
                    quantity > equipment.quantity || 
                    quantity < 1 ||
                    (equipment.optionType === 'rent' && rentalDays < (equipment.duration || 1))
                  }
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
              <p>This equipment is currently unavailable.</p>
              <button 
                onClick={() => navigate('/medicalequipments')}
                className="browse-btn"
              >
                Browse Other Equipment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MedicalEquipmentDetails;