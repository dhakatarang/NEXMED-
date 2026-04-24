/*

  Donate-Rent Page -> (On navbar)

*/

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DonateRent.css';

const DonateRent = () => {
  const [formData, setFormData] = useState({
    itemType: 'medicine',
    optionType: 'donate',
    name: '',
    description: '',
    quantity: '',
    price: '',
    rentPrice: '',
    duration: '',
    termsAccepted: false
  });
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [highlightRent, setHighlightRent] = useState(false);

  // Calculate estimated values for rent comparison
  const calculateRentComparison = () => {
    if (!formData.price || !formData.rentPrice) return null;
    
    const salePrice = parseFloat(formData.price);
    const dailyRent = parseFloat(formData.rentPrice);
    
    const weeklyCost = dailyRent * 7;
    const monthlyCost = dailyRent * 30;
    const breakEvenDays = salePrice / dailyRent;
    
    return {
      weeklyCost: weeklyCost.toFixed(2),
      monthlyCost: monthlyCost.toFixed(2),
      breakEvenDays: Math.ceil(breakEvenDays)
    };
  };

  const rentComparison = calculateRentComparison();

  useEffect(() => {
    if (formData.optionType === 'rent') {
      setHighlightRent(true);
      const timer = setTimeout(() => setHighlightRent(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [formData.optionType]);

  // Reset option type to donate if medicine is selected and current option is rent
  useEffect(() => {
    if (formData.itemType === 'medicine' && formData.optionType === 'rent') {
      setFormData(prev => ({
        ...prev,
        optionType: 'donate',
        rentPrice: '',
        duration: ''
      }));
      setMessage('Rent option is not available for medicine. Switched to Donate.');
    }
  }, [formData.itemType]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionTypeChange = (optionType) => {
    // Prevent selecting rent for medicine
    if (formData.itemType === 'medicine' && optionType === 'rent') {
      setMessage('Rent option is only available for Medical Equipment');
      return;
    }

    setFormData(prev => ({
      ...prev,
      optionType,
      // Reset price fields when switching to donate
      ...(optionType === 'donate' && { price: '', rentPrice: '', duration: '' }),
      // Reset rent fields when switching from rent
      ...(prev.optionType === 'rent' && optionType !== 'rent' && { rentPrice: '', duration: '' })
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size > 5 * 1024 * 1024) {
      setMessage('File size must be less than 5MB');
      return;
    }
    setImage(file);
    setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.termsAccepted) {
      setMessage('Please accept the terms and conditions');
      return;
    }

    // Enhanced validation
    if (formData.optionType === 'sell' && !formData.price) {
      setMessage('Price is required for selling items');
      return;
    }

    if (formData.optionType === 'rent') {
      if (!formData.rentPrice) {
        setMessage('Rent price is required for rental items');
        return;
      }
      if (parseFloat(formData.rentPrice) <= 0) {
        setMessage('Rent price must be greater than 0');
        return;
      }
    }

    setLoading(true);
    setMessage('');

    const submitData = new FormData();
    
    Object.keys(formData).forEach(key => {
      if (key === 'termsAccepted') {
        submitData.append(key, formData[key].toString());
      } else {
        submitData.append(key, formData[key]);
      }
    });
    
    if (image) {
      submitData.append('image', image);
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login to add items');
        setLoading(false);
        return;
      }

      const response = await axios.post('http://localhost:5001/api/donaterent/add', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setMessage('Item added successfully!');
        // Reset form
        setFormData({
          itemType: 'medicine',
          optionType: 'donate',
          name: '',
          description: '',
          quantity: '',
          price: '',
          rentPrice: '',
          duration: '',
          termsAccepted: false
        });
        setImage(null);
        const fileInput = document.getElementById('image-upload');
        if (fileInput) fileInput.value = '';
      }
    } catch (error) {
      console.error('Error adding item:', error);
      setMessage(error.response?.data?.message || error.response?.data?.error || 'Error adding item');
    } finally {
      setLoading(false);
    }
  };

  // Check if rent option should be available
  const isRentAvailable = formData.itemType === 'medicalequipment';

  return (
    <div className="donate-rent-page">
      {/* Inspirational Message */}
      <div className="inspiration-section">
        <h2>Make a Difference</h2>
        <p>
          Your unused medical supplies can save lives. Join our community of givers 
          and help make healthcare accessible to everyone.
        </p>
      </div>

      {/* Form Container */}
      <div className="form-container">
        <div className="form-header">
          <h3>Add Your Item</h3>
        </div>
        
        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Item Type Selection */}
          <div className="form-row">
            <div className="form-group">
              <label>Item Type</label>
              <select 
                name="itemType" 
                value={formData.itemType} 
                onChange={handleInputChange}
                className="form-select"
              >
                <option value="medicine">Medicine</option>
                <option value="medicalequipment">Medical Equipment</option>
              </select>
            </div>

            <div className="form-group">
              <label>Action</label>
              <select 
                name="optionType" 
                value={formData.optionType} 
                onChange={(e) => handleOptionTypeChange(e.target.value)}
                className="form-select"
              >
                <option value="donate">Donate</option>
                <option value="sell">Sell</option>
                <option value="rent" disabled={!isRentAvailable}>Rent {!isRentAvailable && '(Equipment only)'}</option>
              </select>
            </div>
          </div>

          {/* Basic Information */}
          <div className="form-group">
            <label>Item Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe the item condition, expiry date, specifications, etc."
              rows="3"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Enter quantity"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
            </div>
          </div>

          {/* Pricing Section */}
          {(formData.optionType === 'sell' || formData.optionType === 'rent') && (
            <div className="pricing-section">
              <h4>Pricing Information</h4>
              
              {formData.optionType === 'sell' && (
                <div className="form-group">
                  <label>Price (₹)</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="Enter sale price"
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              )}

              {formData.optionType === 'rent' && isRentAvailable && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Sale Price (₹) - Optional</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="Enter sale price if applicable"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    <div className="form-group">
                      <label>Daily Rent (₹)</label>
                      <input
                        type="number"
                        name="rentPrice"
                        value={formData.rentPrice}
                        onChange={handleInputChange}
                        placeholder="Enter rent per day"
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>
                  </div>

                  {/* Rent Comparison */}
                  {rentComparison && (
                    <div className="comparison-box">
                      <div className="comparison-item">
                        <span className="comparison-label">Weekly</span>
                        <span className="comparison-value">₹{rentComparison.weeklyCost}</span>
                      </div>
                      <div className="comparison-item">
                        <span className="comparison-label">Monthly</span>
                        <span className="comparison-value">₹{rentComparison.monthlyCost}</span>
                      </div>
                      <div className="comparison-item highlight">
                        <span className="comparison-label">Break-even</span>
                        <span className="comparison-value">{rentComparison.breakEvenDays} days</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Terms and Conditions */}
          <div className="terms-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleInputChange}
                required
              />
              <span>I accept the <button type="button" className="terms-link">terms and conditions</button></span>
            </label>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Adding Item...' : `Add Item for ${formData.optionType === 'donate' ? 'Donation' : formData.optionType === 'sell' ? 'Sale' : 'Rental'}`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default DonateRent;