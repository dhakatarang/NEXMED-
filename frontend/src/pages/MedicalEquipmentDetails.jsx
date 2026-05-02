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
  
  // AI Scan States
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanImage, setScanImage] = useState(null);
  const [showAIScan, setShowAIScan] = useState(false);

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

  // AI Scan Handler
  const handleScanEquipment = async (imageFile) => {
    if (!imageFile) return;
    
    const formData = new FormData();
    formData.append("equipmentImage", imageFile);
    formData.append("equipmentName", equipment.name);
    formData.append("equipmentId", equipment.id);

    setScanning(true);
    setScanResult(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showMessage("Please login to use AI scan feature", "error");
        return;
      }

      const response = await axios.post(
        "https://nexmed.onrender.com/api/equipment-scan/scan",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setScanResult(response.data.analysis);
        showMessage("AI scan completed successfully!", "success");
      } else {
        showMessage(response.data.message || "Scan failed", "error");
      }
    } catch (error) {
      console.error("Scan error:", error);
      showMessage(
        error.response?.data?.message || "Failed to scan equipment. Please try again.", 
        "error"
      );
    } finally {
      setScanning(false);
    }
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

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `https://nexmed.onrender.com/api/equipments/action/${id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

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
      const token = localStorage.getItem("token");
      
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
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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

          {/* AI Condition Analysis Section - NEW */}
          <div className="ai-scan-section">
            <button
              onClick={() => setShowAIScan(!showAIScan)}
              className="ai-scan-toggle-btn"
            >
              <span className="ai-icon">🤖</span>
              {showAIScan ? 'Hide AI Condition Scanner' : 'AI Verify Equipment Condition'}
            </button>

            {showAIScan && (
              <div className="ai-scan-content">
                <div className="info-item">
                  <span className="info-label">AI Condition Analysis</span>
                  <div className="mt-2">
                    <label className="block text-sm text-gray-600 mb-1">
                      Upload Equipment Photo for AI Analysis
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          setScanImage(e.target.files[0]);
                          handleScanEquipment(e.target.files[0]);
                        }
                      }}
                      className="text-sm border rounded p-1 w-full"
                      disabled={scanning}
                    />
                    {scanning && (
                      <div className="mt-2 text-blue-600 text-sm flex items-center">
                        <span className="inline-block animate-spin mr-2">⏳</span>
                        AI is analyzing the equipment condition...
                      </div>
                    )}
                    {scanResult && !scanning && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-semibold">AI Assessment:</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            scanResult.overallCondition === 'excellent' ? 'bg-green-100 text-green-700' :
                            scanResult.overallCondition === 'good' ? 'bg-blue-100 text-blue-700' :
                            scanResult.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {scanResult.overallCondition?.toUpperCase()} ({scanResult.confidenceScore}% confidence)
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{scanResult.summary}</p>
                        <details className="mt-2 text-xs text-gray-600">
                          <summary className="cursor-pointer hover:text-gray-800">
                            View detailed analysis
                          </summary>
                          <div className="mt-2 space-y-1 pl-2 border-l-2 border-gray-200">
                            <p><strong>Physical:</strong> {scanResult.detailedAnalysis?.physicalAppearance}</p>
                            <p><strong>Functionality:</strong> {scanResult.detailedAnalysis?.functionality}</p>
                            <p><strong>Safety:</strong> {scanResult.detailedAnalysis?.safetyConcerns}</p>
                            <p><strong>Cleanliness:</strong> {scanResult.detailedAnalysis?.cleanliness}</p>
                            <p><strong>Missing Components:</strong> {scanResult.detailedAnalysis?.missingComponents}</p>
                            <p><strong>Recommendation:</strong> {scanResult.recommendations}</p>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

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

      {/* Add CSS for AI Scan Section */}
      <style jsx>{`
        .ai-scan-section {
          margin: 20px 0;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 12px;
        }
        
        .ai-scan-toggle-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: transform 0.2s;
        }
        
        .ai-scan-toggle-btn:hover {
          transform: translateY(-2px);
        }
        
        .ai-icon {
          font-size: 24px;
        }
        
        .ai-scan-content {
          margin-top: 15px;
          padding: 15px;
          background: white;
          border-radius: 8px;
          border: 1px solid #e0e0e0;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
};

export default MedicalEquipmentDetails;