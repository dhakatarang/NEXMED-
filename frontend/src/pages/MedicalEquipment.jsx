/*
  MedicineEquipment Page -> (on navbar)
*/

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MedicalEquipment.css';

const MedicalEquipment = () => {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [imageErrors, setImageErrors] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/equipments/all');
      
      if (response.data.success) {
        const safeEquipments = response.data.equipments.map(equipment => ({
          id: equipment.id || 0,
          name: equipment.name || 'Unnamed Equipment',
          description: equipment.description || 'No description available',
          quantity: equipment.quantity || 0,
          price: equipment.price || 0,
          rentPrice: equipment.rentPrice || equipment.rent_price || 0,
          optionType: equipment.optionType || equipment.option_type || 'donate',
          image: equipment.image || equipment.image_path || null,
          duration: equipment.duration || equipment.min_rental_days || 0,
          condition: equipment.condition || 'good'
        }));
        
        // Filter out any default/demo items
        const realEquipments = safeEquipments.filter(equipment => {
          if (equipment.name === 'Unnamed Equipment' || 
              equipment.name.includes('Demo') || 
              equipment.name.includes('Test') ||
              equipment.description === 'No description available') {
            return false;
          }
          return true;
        });
        
        setEquipments(realEquipments);
      } else {
        setMessage('Failed to fetch medical equipment');
      }
    } catch (error) {
      console.error('Error fetching medical equipment:', error);
      setMessage('Error fetching medical equipment');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (equipmentId) => {
    setImageErrors(prev => new Set(prev.add(equipmentId)));
  };

  const handleViewDetails = (equipmentId) => {
    navigate(`/medicalequipments/${equipmentId}`);
  };

  const getEquipmentIcon = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('wheelchair')) return '♿';
    if (lowerName.includes('bed')) return '🛏️';
    if (lowerName.includes('walker')) return '🚶';
    if (lowerName.includes('oxygen')) return '💨';
    if (lowerName.includes('monitor')) return '📊';
    if (lowerName.includes('crutch')) return '🩼';
    return '⚕️';
  };

  const filteredEquipments = equipments.filter(equipment => {
    const matchesSearch = searchTerm === '' || 
      equipment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipment.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = activeFilter === 'all' || equipment.optionType === activeFilter;
    
    return matchesSearch && matchesFilter;
  });

  const getCount = (type) => {
    if (type === 'all') return equipments.length;
    return equipments.filter(e => e.optionType === type).length;
  };

  if (loading) {
    return (
      <div className="med-equip-loading">
        <div className="med-equip-loading-spinner"></div>
        <p>Loading medical equipment...</p>
      </div>
    );
  }

  return (
    <div className="med-equip-modern">
      {/* Hero Section */}
      <div className="med-equip-hero">
        <div className="med-equip-hero-content">
          <h1>
            Medical Equipment
            <span className="med-equip-hero-highlight"> Find What You Need</span>
          </h1>
          <p>Browse through our extensive collection of medical equipment available for donation, sale, or rent</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="med-equip-search-modern">
        <div className="med-equip-search-wrapper">
          <div className="med-equip-search-header">
            <span className="med-equip-search-badge">Instant Search</span>
            <h2>Find Medical Equipment</h2>
            <p>Discover equipment available in your community</p>
          </div>
          
          <div className="med-equip-search-box-modern">
            <input
              type="text"
              placeholder="Search by name, description, or condition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="med-equip-search-input-modern"
            />
            <button className="med-equip-search-button">
              <span>Search</span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="med-equip-filters-modern">
        <div className="med-equip-filters-scroll">
          <button
            className={`med-equip-filter-modern ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            All <span className="med-equip-filter-count-modern">{getCount('all')}</span>
          </button>
          <button
            className={`med-equip-filter-modern donate ${activeFilter === 'donate' ? 'active' : ''}`}
            onClick={() => setActiveFilter('donate')}
          >
            Donate <span className="med-equip-filter-count-modern">{getCount('donate')}</span>
          </button>
          <button
            className={`med-equip-filter-modern sell ${activeFilter === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveFilter('sell')}
          >
            Sell <span className="med-equip-filter-count-modern">{getCount('sell')}</span>
          </button>
          <button
            className={`med-equip-filter-modern rent ${activeFilter === 'rent' ? 'active' : ''}`}
            onClick={() => setActiveFilter('rent')}
          >
            Rent <span className="med-equip-filter-count-modern">{getCount('rent')}</span>
          </button>
        </div>
        <div className="med-equip-results-modern">
          <span className="med-equip-results-number-modern">{filteredEquipments.length}</span>
          <span> items available</span>
        </div>
      </div>

      {/* Error Message */}
      {message && (
        <div className="med-equip-error-modern">
          <span>{message}</span>
          <button onClick={fetchEquipments}>Try Again</button>
        </div>
      )}

      {/* Equipment Grid */}
      {filteredEquipments.length === 0 ? (
        <div className="med-equip-empty-modern">
          <div className="med-equip-empty-icon-modern">🏥</div>
          <h3>No equipment found</h3>
          <p>Be the first to donate or sell medical equipment!</p>
          {(searchTerm || activeFilter !== 'all') && (
            <button onClick={() => {
              setSearchTerm('');
              setActiveFilter('all');
            }} className="med-equip-clear-modern">
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="med-equip-grid-modern">
          {filteredEquipments.map(equipment => (
            <div key={equipment.id} className="med-equip-card-modern">
              <div className="med-equip-card-image-modern">
                {equipment.image && !imageErrors.has(equipment.id) ? (
                  <img 
                    src={`http://localhost:5001/uploads/${equipment.image}`} 
                    alt={equipment.name}
                    onError={() => handleImageError(equipment.id)}
                  />
                ) : (
                  <div className="med-equip-image-placeholder-modern">
                    {getEquipmentIcon(equipment.name)}
                  </div>
                )}
                <div className="med-equip-stock-modern">{equipment.quantity} left</div>
              </div>
              <div className="med-equip-card-content-modern">
                <h3>{equipment.name}</h3>
                <p>{equipment.description}</p>
                <div className="med-equip-card-badges-modern">
                  <span className={`med-equip-type-modern ${equipment.optionType}`}>
                    {equipment.optionType}
                  </span>
                  <span className="med-equip-condition-modern">{equipment.condition}</span>
                </div>
                <div className="med-equip-price-modern">
                  {equipment.optionType === 'sell' && equipment.price > 0 && (
                    <div className="med-equip-price-row-modern">
                      <span>Price</span>
                      <strong>₹{equipment.price}</strong>
                    </div>
                  )}
                  {equipment.optionType === 'rent' && equipment.rentPrice > 0 && (
                    <div className="med-equip-price-row-modern">
                      <span>Daily Rent</span>
                      <strong className="rent-price">₹{equipment.rentPrice}</strong>
                    </div>
                  )}
                </div>
                <button onClick={() => handleViewDetails(equipment.id)} className="med-equip-view-modern">
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

export default MedicalEquipment;