/*
  Home page (Main Website) -> When a User login it is a Home Page 
*/

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '@lottiefiles/lottie-player';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-pattern"></div>
        </div>
        
        <div className="hero-content">
          <div className="hero-left">
            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Your Health,
              <span className="hero-title-highlight"> Our Priority</span>
            </motion.h1>

            <motion.p
              className="hero-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Connect with your community to buy, sell, donate, or rent medical supplies 
              and equipment. Safe, reliable, and accessible healthcare for everyone.
            </motion.p>

            <motion.div
              className="hero-buttons"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Link to="/medicines" className="btn btn-primary">
                <span>Explore Medicines</span>
              </Link>
              <Link to="/medicalequipments" className="btn btn-secondary">
                <span>View Equipment</span>
              </Link>
            </motion.div>
          </div>

          <motion.div
            className="hero-right"
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            <div className="animation-container">
              <lottie-player
                src="https://assets10.lottiefiles.com/packages/lf20_jcikwtux.json"
                background="transparent"
                speed="1"
                style={{ width: '500px', height: '500px' }}
                loop
                autoplay
              ></lottie-player>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Quick Actions Section */}
      <section className="quick-actions-section">
        <div className="quick-actions-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="quick-actions-content"
          >
            <div className="section-header">
              <span className="section-badge">Get Started</span>
              <h2>Quick Actions</h2>
              <p>Start your journey with NexMed in just a few clicks</p>
            </div>

            <div className="quick-actions-grid">
              <Link to="/medicines" className="quick-action-card">
                <div className="action-icon">💊</div>
                <h3>Browse Medicines</h3>
                <p>Discover available medicines in your community</p>
                <span className="action-link">Explore →</span>
              </Link>

              <Link to="/medicalequipments" className="quick-action-card">
                <div className="action-icon">🏥</div>
                <h3>Find Equipment</h3>
                <p>Search for medical equipment near you</p>
                <span className="action-link">Search →</span>
              </Link>

              <Link to="/donaterent" className="quick-action-card">
                <div className="action-icon">🤝</div>
                <h3>Share Resources</h3>
                <p>Donate, sell, or rent your medical supplies</p>
                <span className="action-link">Contribute →</span>
              </Link>

              <Link to="/profile" className="quick-action-card">
                <div className="action-icon">👤</div>
                <h3>Your Profile</h3>
                <p>View your listings and manage your account</p>
                <span className="action-link">View Profile →</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="categories-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="categories-content"
          >
            <div className="section-header">
              <span className="section-badge">Explore</span>
              <h2>Browse by Category</h2>
              <p>Find exactly what you're looking for</p>
            </div>

            <div className="categories-grid">
              <Link to="/medicines?type=donate" className="category-card">
                <div className="category-icon">🎁</div>
                <h3>Free Medicines</h3>
                <p>Available for donation</p>
              </Link>

              <Link to="/medicines?type=sell" className="category-card">
                <div className="category-icon">💰</div>
                <h3>Medicines for Sale</h3>
                <p>Affordable options</p>
              </Link>

              <Link to="/medicalequipments?type=donate" className="category-card">
                <div className="category-icon">🎁</div>
                <h3>Free Equipment</h3>
                <p>Donated equipment</p>
              </Link>

              <Link to="/medicalequipments?type=rent" className="category-card">
                <div className="category-icon">⏱️</div>
                <h3>Equipment Rental</h3>
                <p>Temporary usage</p>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recent Activity Section */}
      <section className="recent-section">
        <div className="recent-container">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="recent-content"
          >
            <div className="section-header">
              <span className="section-badge">Stay Updated</span>
              <h2>Recent Activity</h2>
              <p>What's happening in the community</p>
            </div>

            <div className="recent-grid">
              <div className="recent-card">
                <div className="recent-icon">💊</div>
                <div className="recent-info">
                  <h3>New Medicines Added</h3>
                  <p>Check out the latest medicines available in your area</p>
                  <Link to="/medicines" className="recent-link">View All →</Link>
                </div>
              </div>

              <div className="recent-card">
                <div className="recent-icon">🏥</div>
                <div className="recent-info">
                  <h3>Equipment Available</h3>
                  <p>New medical equipment listings added by community members</p>
                  <Link to="/medicalequipments" className="recent-link">View All →</Link>
                </div>
              </div>

              <div className="recent-card">
                <div className="recent-icon">🤝</div>
                <div className="recent-info">
                  <h3>Successful Donations</h3>
                  <p>See how community members are helping each other</p>
                  <Link to="/about" className="recent-link">Learn More →</Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;