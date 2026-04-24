import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Card.css';

function Card({ title, description, link, image }) {
    const navigate = useNavigate();

    const handleClick = () => {
        navigate(link);
    };

    return (
        <div className="card" onClick={handleClick}>
            <div className="card-image-wrapper">
                <img src={image} alt={title} className="card-image" />
            </div>
            <div className="card-content">
                <h3 className="card-title">{title}</h3>
                <p className="card-description">{description}</p>
            </div>
        </div>
    );
}

export default Card;