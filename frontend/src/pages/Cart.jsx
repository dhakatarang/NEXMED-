/*

  Cart Section -> When user add some medicine, equipment to buy

*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const navigate = useNavigate();

  // ✅ Get base URL dynamically based on environment
  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return 'https://nexmed.onrender.com';
  };

  const BASE_URL = getBaseUrl();

  // ✅ Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // ✅ Axios instance with auth header
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add token to requests
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  useEffect(() => {
    fetchCartItems();
  }, []);

  const showMessage = (text, type = 'error') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 3000);
  };

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!token) {
        showMessage('Please login to view your cart', 'error');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const response = await axiosInstance.get('/api/cart');
      console.log('✅ Cart items:', response.data);
      setCartItems(response.data.cartItems || []);
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      if (error.response?.status === 401) {
        showMessage('Please login again', 'error');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        showMessage('Error loading cart items', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      await axiosInstance.delete(`/api/cart/${cartId}`);
      setCartItems(cartItems.filter(item => item.id !== cartId));
      showMessage('Item removed from cart', 'success');
    } catch (error) {
      console.error('❌ Error removing item:', error);
      showMessage('Error removing item from cart', 'error');
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axiosInstance.put(`/api/cart/${cartId}`, {
        quantity: newQuantity
      });
      setCartItems(cartItems.map(item => 
        item.id === cartId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      showMessage('Error updating quantity', 'error');
    }
  };

  const updateRentalDays = async (cartId, newDays) => {
    if (newDays < 1) return;
    
    try {
      await axiosInstance.put(`/api/cart/${cartId}`, {
        rentalDays: newDays
      });
      setCartItems(cartItems.map(item => 
        item.id === cartId ? { ...item, rentalDays: newDays } : item
      ));
    } catch (error) {
      console.error('❌ Error updating rental days:', error);
      showMessage('Error updating rental duration', 'error');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      let itemTotal = 0;
      if (item.optionType === 'rent') {
        itemTotal = (item.rentPrice || 0) * item.quantity * (item.rentalDays || 1);
      } else if (item.optionType === 'sell' || item.optionType === 'donate') {
        itemTotal = (item.price || 0) * item.quantity;
      } else {
        itemTotal = (item.price || 0) * item.quantity;
      }
      return total + itemTotal;
    }, 0);
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      showMessage('Processing checkout...', 'success');
      
      const token = getAuthToken();
      if (!token) {
        showMessage('Please login to checkout', 'error');
        navigate('/login');
        return;
      }

      // Create order
      const orderData = {
        items: cartItems.map(item => ({
          itemId: item.itemId,
          itemType: item.itemType,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          rentPrice: item.rentPrice,
          rentalDays: item.rentalDays,
          optionType: item.optionType
        })),
        totalAmount: getTotalPrice(),
        orderDate: new Date().toISOString()
      };

      const response = await axiosInstance.post('/api/orders/create', orderData);
      
      if (response.data.success) {
        // Clear cart after successful order
        await axiosInstance.delete('/api/cart/clear');
        setCartItems([]);
        showMessage('Order placed successfully! Thank you for your purchase.', 'success');
        
        setTimeout(() => {
          navigate('/orders');
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Order failed');
      }
      
    } catch (error) {
      console.error('❌ Checkout error:', error);
      showMessage(error.response?.data?.message || 'Error during checkout. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const getItemSubtotal = (item) => {
    if (item.optionType === 'rent') {
      return (item.rentPrice || 0) * item.quantity * (item.rentalDays || 1);
    } else {
      return (item.price || 0) * item.quantity;
    }
  };

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('/')) return `${BASE_URL}${imagePath}`;
    return `${BASE_URL}/uploads/${imagePath}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-header">
        <h1>Shopping Cart</h1>
      </div>
      
      {message && (
        <div className={`message ${messageType === 'success' ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some medicines or medical equipment to get started!</p>
          <div className="empty-actions">
            <button 
              onClick={() => navigate('/medicines')}
              className="btn btn-primary"
            >
              Browse Medicines
            </button>
            <button 
              onClick={() => navigate('/medicalequipments')}
              className="btn btn-secondary"
            >
              Browse Equipment
            </button>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="items-header">
              <h3>Cart Items ({cartItems.length})</h3>
            </div>
            
            <div className="cart-items-list">
              {cartItems.map(item => (
                <div key={item.id} className="cart-item">
                  <div className="item-image">
                    {item.image ? (
                      <img 
                        src={getImageUrl(item.image)} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="image-placeholder" style={{ display: item.image ? 'none' : 'flex' }}>
                      {item.itemType === 'medicine' ? '💊' : '⚕️'}
                    </div>
                  </div>
                  
                  <div className="item-info">
                    <div className="item-header">
                      <h4>{item.name}</h4>
                      <span className={`item-type ${item.optionType}`}>
                        {item.optionType === 'donate' ? 'Free' : 
                         item.optionType === 'sell' ? 'For Sale' : 
                         item.optionType === 'rent' ? 'For Rent' : item.optionType}
                      </span>
                    </div>
                    
                    <p className="item-description">{item.description?.substring(0, 100)}</p>
                    
                    <div className="item-pricing">
                      {item.optionType === 'rent' ? (
                        <div className="rent-details">
                          <span className="price">₹{item.rentPrice}/day</span>
                          {item.rentalDays && (
                            <span className="duration">{item.rentalDays} days</span>
                          )}
                        </div>
                      ) : item.optionType === 'donate' ? (
                        <span className="price free">Free</span>
                      ) : (
                        <span className="price">₹{item.price}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="item-actions">
                    <div className="quantity-control">
                      <label>Qty</label>
                      <div className="quantity-buttons">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          className="qty-btn"
                        >
                          −
                        </button>
                        <span className="qty-display">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="qty-btn"
                          disabled={item.quantity >= (item.maxQuantity || 99)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {item.optionType === 'rent' && (
                      <div className="rental-control">
                        <label>Days</label>
                        <div className="quantity-buttons">
                          <button 
                            onClick={() => updateRentalDays(item.id, (item.rentalDays || 1) - 1)}
                            disabled={(item.rentalDays || 1) <= 1}
                            className="qty-btn"
                          >
                            −
                          </button>
                          <span className="qty-display">{item.rentalDays || 1}</span>
                          <button 
                            onClick={() => updateRentalDays(item.id, (item.rentalDays || 1) + 1)}
                            className="qty-btn"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    )}
                    
                    <div className="item-subtotal">
                      <span className="subtotal-label">Subtotal</span>
                      <span className="subtotal-value">₹{getItemSubtotal(item).toFixed(2)}</span>
                    </div>
                    
                    <button 
                      className="remove-btn"
                      onClick={() => removeFromCart(item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="cart-summary">
            <h3>Order Summary</h3>
            
            <div className="summary-details">
              <div className="summary-row">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="shipping-free">Free</span>
              </div>
              <div className="summary-row">
                <span>Tax (GST)</span>
                <span>Included</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
            
            <button 
              className="continue-shopping"
              onClick={() => navigate('/medicines')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;