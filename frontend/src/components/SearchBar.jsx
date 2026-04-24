import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './SearchBar.css';

function SearchBar({ placeholder = "Search medicines, equipment, or services...", onSearch, autoFocus = false }) {
    const [query, setQuery] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [recentSearches, setRecentSearches] = useState([]);
    const inputRef = useRef(null);
    const navigate = useNavigate();

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
                navigate('/search', { state: { query } });
            }
            
            setIsExpanded(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        } else if (e.key === 'Escape') {
            setIsExpanded(false);
            setQuery('');
        }
    };

    const handleRecentClick = (term) => {
        setQuery(term);
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const clearSearch = () => {
        setQuery('');
        if (inputRef.current) {
            inputRef.current.focus();
        }
    };

    const clearRecent = () => {
        setRecentSearches([]);
        localStorage.removeItem('recentSearches');
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
                        onFocus={() => setIsExpanded(true)}
                        onBlur={() => {
                            // Delay to allow click on recent searches
                            setTimeout(() => setIsExpanded(false), 200);
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
                </div>
                
                <button 
                    className="search-button"
                    onClick={handleSearch}
                    disabled={!query.trim()}
                >
                    <span>Search</span>
                </button>
            </div>

            {/* Recent Searches Dropdown */}
            {isExpanded && recentSearches.length > 0 && (
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