import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './SearchBar.css';

function SearchBar({ placeholder = "Search medicines, equipment, or services...", onSearch, autoFocus = false }) {
    const [query, setQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const inputRef = useRef(null);
    const navigate = useNavigate();

    // Get base URL dynamically
    const getBaseUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'http://localhost:5001';
        }
        return 'https://nexmed-backend.onrender.com';
    };

    const BASE_URL = getBaseUrl();

    // Load recent searches from localStorage
    useEffect(() => {
        const saved = localStorage.getItem('recentSearches');
        if (saved) {
            setRecentSearches(JSON.parse(saved).slice(0, 5));
        }
    }, []);

    // Auto focus if enabled
    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    // Debounced search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (query.trim().length >= 2) {
                performSearch(query);
            } else {
                setSearchResults([]);
                setShowResults(false);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query]);

    const performSearch = async (searchQuery) => {
        if (!searchQuery.trim()) return;
        
        setIsLoading(true);
        try {
            const token = localStorage.getItem("token");
            
            // Search both medicines and equipment
            const [medicinesRes, equipmentsRes] = await Promise.all([
                axios.get(`${BASE_URL}/api/medicines/search?q=${encodeURIComponent(searchQuery)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                }),
                axios.get(`${BASE_URL}/api/equipments/search?q=${encodeURIComponent(searchQuery)}`, {
                    headers: token ? { Authorization: `Bearer ${token}` } : {}
                })
            ]);

            const results = [];
            
            // Add medicines to results
            if (medicinesRes.data.success && medicinesRes.data.medicines) {
                medicinesRes.data.medicines.forEach(medicine => {
                    results.push({
                        id: medicine.id,
                        type: 'medicine',
                        name: medicine.name,
                        description: medicine.description,
                        price: medicine.price,
                        image: medicine.image_path,
                        category: 'Medicine'
                    });
                });
            }
            
            // Add equipments to results
            if (equipmentsRes.data.success && equipmentsRes.data.equipments) {
                equipmentsRes.data.equipments.forEach(equipment => {
                    results.push({
                        id: equipment.id,
                        type: 'equipment',
                        name: equipment.name,
                        description: equipment.description,
                        price: equipment.price,
                        rentPrice: equipment.rentPrice,
                        image: equipment.image,
                        category: 'Equipment'
                    });
                });
            }
            
            setSearchResults(results);
            setShowResults(results.length > 0);
        } catch (error) {
            console.error('Search error:', error);
            setSearchResults([]);
            setShowResults(false);
        } finally {
            setIsLoading(false);
        }
    };

    const saveSearch = (searchTerm) => {
        if (!searchTerm.trim()) return;
        
        const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
        setRecentSearches(updated);
        localStorage.setItem('recentSearches', JSON.stringify(updated));
    };

    const handleSearch = () => {
        if (query.trim()) {
            saveSearch(query);
            
            if (onSearch) {
                onSearch(query);
            } else {
                // Navigate to search results page with the query
                navigate('/search', { state: { query: query, results: searchResults } });
            }
            
            setIsExpanded(false);
            setShowResults(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setIsExpanded(false);
            setShowResults(false);
            setQuery('');
        }
    };

    const handleRecentClick = (term) => {
        setQuery(term);
        performSearch(term);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const handleResultClick = (result) => {
        saveSearch(query);
        // Navigate to the appropriate detail page
        if (result.type === 'medicine') {
            navigate(`/medicines/${result.id}`);
        } else if (result.type === 'equipment') {
            navigate(`/medicalequipments/${result.id}`);
        }
        setShowResults(false);
        setIsExpanded(false);
        setQuery('');
    };

    const clearSearch = () => {
        setQuery('');
        setSearchResults([]);
        setShowResults(false);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const clearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
    };

    const getImageUrl = (imagePath) => {
        if (!imagePath) return null;
        if (imagePath.startsWith('http')) return imagePath;
        if (imagePath.startsWith('/')) return `${BASE_URL}${imagePath}`;
        return `${BASE_URL}/uploads/${imagePath}`;
    };

    return (
        <div className={`search-bar-container ${isExpanded ? 'expanded' : ''}`}>
            <div className="search-wrapper">
                <div className="search-input-wrapper">
                    <svg 
                        className="search-icon" 
                        width="20" 
                        height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        className="search-input"
                        placeholder={placeholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyPress}
                        onFocus={() => {
                            setIsExpanded(true);
                            if (query.length >= 2) setShowResults(true);
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                setIsExpanded(false);
                                setShowResults(false);
                            }, 200);
                        }}
                    />
                    
                    {query && (
                        <button 
                            className="clear-button"
                            onClick={clearSearch}
                            aria-label="Clear search"
                        >
                            ×
                        </button>
                    )}
                    
                    {isLoading && (
                        <div className="search-loading">
                            <div className="loading-spinner-small"></div>
                        </div>
                    )}
                </div>
                
                <button 
                    className="search-button"
                    onClick={handleSearch}
                    disabled={!query.trim()}
                >
                    <span>Search</span>
                </button>
            </div>

            {/* Search Results Dropdown */}
            {showResults && searchResults.length > 0 && (
                <div className="search-results-dropdown">
                    <div className="results-header">
                        <span className="results-title">Search Results ({searchResults.length})</span>
                    </div>
                    <ul className="results-list">
                        {searchResults.slice(0, 8).map((result, index) => (
                            <li key={`${result.type}-${result.id}-${index}`} className="result-item">
                                <button
                                    onClick={() => handleResultClick(result)}
                                    className="result-link"
                                >
                                    <div className="result-image">
                                        {result.image ? (
                                            <img 
                                                src={getImageUrl(result.image)} 
                                                alt={result.name}
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.parentNode.innerHTML = result.type === 'medicine' ? '💊' : '⚕️';
                                                }}
                                            />
                                        ) : (
                                            <span className="result-icon">
                                                {result.type === 'medicine' ? '💊' : '⚕️'}
                                            </span>
                                        )}
                                    </div>
                                    <div className="result-info">
                                        <div className="result-name">
                                            {result.name}
                                            <span className="result-category">{result.category}</span>
                                        </div>
                                        <div className="result-description">
                                            {result.description?.substring(0, 60)}...
                                        </div>
                                        <div className="result-price">
                                            {result.price === 0 ? 'Free' : `₹${result.price}`}
                                            {result.rentPrice && (
                                                <span className="rent-price"> | Rent: ₹{result.rentPrice}/day</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            </li>
                        ))}
                    </ul>
                    {searchResults.length > 8 && (
                        <div className="view-all">
                            <button onClick={handleSearch} className="view-all-button">
                                View all {searchResults.length} results
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Recent Searches Dropdown */}
            {isExpanded && !showResults && recentSearches.length > 0 && !query && (
                <div className="recent-searches">
                    <div className="recent-header">
                        <span className="recent-title">Recent Searches</span>
                        <button 
                            className="clear-recent"
                            onClick={clearRecent}
                        >
                            Clear all
                        </button>
                    </div>
                    <ul className="recent-list">
                        {recentSearches.map((term, index) => (
                            <li key={index} className="recent-item">
                                <button
                                    onClick={() => handleRecentClick(term)}
                                    className="recent-link"
                                >
                                    <svg 
                                        width="16" 
                                        height="16" 
                                        viewBox="0 0 24 24" 
                                        fill="none" 
                                        stroke="currentColor" 
                                        strokeWidth="2"
                                    >
                                        <circle cx="12" cy="12" r="10" />
                                        <polyline points="12 6 12 12 16 14" />
                                    </svg>
                                    <span>{term}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default SearchBar;