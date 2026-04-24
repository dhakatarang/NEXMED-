/*

    Footer -> (Main Footer)

*/

import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

function Footer() {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-content">
                    <div className="footer-brand">
                        <h3>NexMed</h3>
                        <p>Leading the way in healthcare innovation and services.</p>
                    </div>
                    
                    <div className="footer-links">
                        <div className="link-group">
                            <h4>Quick Links</h4>
                            <Link to="/medicines">Medicines</Link>
                            <Link to="/medicalequipments">Medical Equipment</Link>
                            <Link to="/donaterent">Donate/Rent</Link>
                            <Link to="/about">About</Link>
                        </div>
                    </div>
                </div>
                
                <div className="footer-bottom">
                    <p>&copy; 2024 NexMed. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}

export default Footer;