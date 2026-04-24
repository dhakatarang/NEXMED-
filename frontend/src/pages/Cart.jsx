/*

  Cart Section -> When user add some medicin, equipment to buy

*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Cart.css';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCartItems();
  }, []);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/cart');
      console.log('✅ Cart items:', response.data);
      setCartItems(response.data.cartItems || []);
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      setMessage('Error loading cart items');
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartId) => {
    try {
      await axios.delete(`http://localhost:5001/api/cart/${cartId}`);
      setCartItems(cartItems.filter(item => item.id !== cartId));
      setMessage('Item removed from cart');
    } catch (error) {
      console.error('❌ Error removing item:', error);
      setMessage('Error removing item from cart');
    }
  };

  const updateQuantity = async (cartId, newQuantity) => {
    if (newQuantity < 1) return;
    
    try {
      await axios.put(`http://localhost:5001/api/cart/${cartId}`, {
        quantity: newQuantity
      });
      setCartItems(cartItems.map(item => 
        item.id === cartId ? { ...item, quantity: newQuantity } : item
      ));
    } catch (error) {
      console.error('❌ Error updating quantity:', error);
      setMessage('Error updating quantity');
    }
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      let itemTotal = 0;
      if (item.optionType === 'rent') {
        itemTotal = (item.rentPrice || 0) * item.quantity * (item.rentalDays || 1);
      } else {
        itemTotal = (item.price || 0) * item.quantity;
      }
      return total + itemTotal;
    }, 0);
  };

  const handleCheckout = async () => {
    try {
      setMessage('Processing checkout...');
      
      for (const item of cartItems) {
        if (item.itemType === 'medicine') {
          await axios.post(`http://localhost:5001/api/medicines/buy/${item.itemId}`, {
            quantity: item.quantity
          });
        } else if (item.itemType === 'medicalequipment') {
          await axios.post(`http://localhost:5001/api/equipments/action/${item.itemId}`, {
            action: item.optionType === 'rent' ? 'rent' : 'buy',
            quantity: item.quantity,
            rentalDays: item.rentalDays || 1
          });
        }
      }

      await axios.delete('http://localhost:5001/api/cart/clear');
      setCartItems([]);
      setMessage('Checkout successful! Items purchased.');
      
      setTimeout(() => {
        navigate('/medicines');
      }, 2000);
      
    } catch (error) {
      console.error('❌ Checkout error:', error);
      setMessage('Error during checkout: ' + (error.response?.data?.message || 'Please try again'));
    }
  };

  const getItemSubtotal = (item) => {
    if (item.optionType === 'rent') {
      return (item.rentPrice || 0) * item.quantity * (item.rentalDays || 1);
    } else {
      return (item.price || 0) * item.quantity;
    }
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
        <div className={`message ${message.includes('successful') ? 'success' : 'error'}`}>
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
                        src={`http://localhost:5001/uploads/${item.image}`} 
                        alt={item.name}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div className="image-placeholder">
                      {item.itemType === 'medicine' ? '💊' : '⚕️'}
                    </div>
                  </div>
                  
                  <div className="item-info">
                    <div className="item-header">
                      <h4>{item.name}</h4>
                      <span className={`item-type ${item.optionType}`}>
                        {item.optionType}
                      </span>
                    </div>
                    
                    <p className="item-description">{item.description}</p>
                    
                    <div className="item-pricing">
                      {item.optionType === 'rent' ? (
                        <div className="rent-details">
                          <span className="price">₹{item.rentPrice}/day</span>
                          <span className="duration">{item.rentalDays} days</span>
                        </div>
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
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
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
              <div className="summary-row total">
                <span>Total</span>
                <span>₹{getTotalPrice().toFixed(2)}</span>
              </div>
            </div>
            
            <button 
              className="checkout-btn"
              onClick={handleCheckout}
            >
              Proceed to Checkout
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