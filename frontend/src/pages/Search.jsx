// frontend/src/pages/Search.jsx
import React from 'react';
import { useLocation } from 'react-router-dom';

function Search() {
    const location = useLocation();
    const query = location.state?.query || '';

    return (
        <div style={{ padding: '20px' }}>
            <h2>Search Results for "{query}"</h2>
            <p>Backend integration needed to fetch actual search results.</p>
        </div>
    );
}

export default Search;
