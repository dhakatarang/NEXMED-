/*
  Medicine Page -> (On Navbar)
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Medicine.css';

const Medicine = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      setLoading(true);
      setMessage('');
      
      console.log('🔍 Fetching medicines...');
      const response = await axios.get('https://nexmed.onrender.com/api/medicines/all');
      console.log('✅ Medicines response:', response.data);
      
      if (response.data.success) {
        const safeMedicines = response.data.medicines.map(medicine => ({
          id: medicine.id || 0,
          name: medicine.name || 'Unnamed Medicine',
          description: medicine.description || 'No description available',
          quantity: medicine.quantity || 0,
          price: medicine.price || 0,
          optionType: medicine.optionType || medicine.option_type || 'donate',
          image: medicine.image || medicine.image_path || null,
          expiryDate: medicine.expiry_date || null,
          manufacturer: medicine.manufacturer || 'Unknown',
          added_by_name: medicine.added_by_name || 'Unknown'
        }));
        
        // Filter out any default/demo items
        const realMedicines = safeMedicines.filter(medicine => {
          if (medicine.name === 'Unnamed Medicine' || 
              medicine.name.includes('Demo') || 
              medicine.name.includes('Test') ||
              medicine.description === 'No description available') {
            return false;
          }
          return true;
        });
        
        setMedicines(realMedicines);
      } else {
        setMessage('Failed to fetch medicines');
      }
    } catch (error) {
      console.error('💥 Error fetching medicines:', error);
      
      if (error.response) {
        setMessage(`Server error: ${error.response.status} - ${error.response.data.message || 'Unknown error'}`);
      } else if (error.request) {
        setMessage('Network error: Could not connect to server');
      } else {
        setMessage('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (medicineId) => {
    navigate(`/medicines/${medicineId}`);
  };

  const getMedicineIcon = () => {
    return '💊';
  };

  const filteredMedicines = medicines.filter(medicine => {
    const matchesSearch = searchTerm === '' || 
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || medicine.optionType === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getCount = (type) => {
    if (type === 'all') return medicines.length;
    return medicines.filter(m => m.optionType === type).length;
  };

  if (loading) {
    return (
      <div className="med-loading">
        <div className="med-loading-spinner"></div>
        <p>Loading medicines...</p>
      </div>
    );
  }

  return (
    <div className="med-modern">
      {/* Hero Section */}
      <div className="med-hero">
        <div className="med-hero-content">
          <h1>
            Medicines
            <span className="med-hero-highlight"> For Your Health</span>
          </h1>
          <p>Browse available medicines for donation or purchase</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="med-search-modern">
        <div className="med-search-wrapper">
          <div className="med-search-header">
            <span className="med-search-badge">Instant Search</span>
            <h2>Find Medicines</h2>
            <p>Discover medicines available in your community</p>
          </div>
          
          <div className="med-search-box-modern">
            <input
              type="text"
              placeholder="Search by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="med-search-input-modern"
            />
            <button className="med-search-button">
              <span>Search</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="med-filters-modern">
        <div className="med-filters-scroll">
          <button
            className={`med-filter-modern ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All <span className="med-filter-count-modern">{getCount('all')}</span>
          </button>
          <button
            className={`med-filter-modern donate ${activeFilter === 'donate' ? 'active' : ''}`}
            onClick={() => setActiveFilter('donate')}
          >
            Donate <span className="med-filter-count-modern">{getCount('donate')}</span>
          </button>
          <button
            className={`med-filter-modern sell ${activeFilter === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveFilter('sell')}
          >
            Sell <span className="med-filter-count-modern">{getCount('sell')}</span>
          </button>
        </div>
        <div className="med-results-modern">
          <span className="med-results-number-modern">{filteredMedicines.length}</span>
          <span> items available</span>
        </div>
      </div>

      {/* Error Message */}
      {message && (
        <div className="med-error-modern">
          <span>{message}</span>
          <button onClick={fetchMedicines}>Try Again</button>
        </div>
      )}

      {/* Medicines Grid */}
      {filteredMedicines.length === 0 ? (
        <div className="med-empty-modern">
          <div className="med-empty-icon-modern">💊</div>
          <h3>No medicines found</h3>
          <p>Be the first to donate or sell medicines!</p>
          {(searchTerm || activeFilter !== 'all') && (
            <button onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
            }} className="med-clear-modern">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="med-grid-modern">
          {filteredMedicines.map(medicine => (
            <div key={medicine.id} className="med-card-modern">
              <div className="med-card-image-modern">
                {medicine.image ? (
                  <img 
                    src={`https://nexmed.onrender.com/uploads/${medicine.image}`} 
                    alt={medicine.name}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentNode.classList.add('image-fallback');
                    }}
                  />
                ) : (
                  <div className="med-image-placeholder-modern">
                    {getMedicineIcon()}
                  </div>
                )}
                <div className="med-stock-modern">{medicine.quantity} left</div>
              </div>
              <div className="med-card-content-modern">
                <h3>{medicine.name}</h3>
                <p>{medicine.description}</p>
                <div className="med-card-badges-modern">
                  <span className={`med-type-modern ${medicine.optionType}`}>
                    {medicine.optionType}
                  </span>
                </div>
                <div className="med-price-modern">
                  {medicine.optionType === 'sell' && medicine.price > 0 && (
                    <div className="med-price-row-modern">
                      <span>Price</span>
                      <strong>₹{medicine.price}</strong>
                    </div>
                  )}
                  {medicine.optionType === 'donate' && (
                    <div className="med-price-row-modern">
                      <span>Price</span>
                      <strong className="free-price">Free</strong>
                    </div>
                  )}
                </div>
                <button onClick={() => handleViewDetails(medicine.id)} className="med-view-modern">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Medicine;