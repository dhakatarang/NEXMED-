    /*
        Landing Page -> (It is a Page we get before Login/Signup) 
        It contains Navbar, Body sections, and Impact sections
    */

    import React from 'react';
    import { useNavigate } from 'react-router-dom';
    import medicalImage from '../assets/medical-hero.jpg';
    import './LandingPage.css';

    function LandingPage() {
        const navigate = useNavigate();

        return (
            <div className="landing-page">
                {/* Header/Navigation */}
                <header className="landing-header">
                    <div className="header-container">
                        <div className="logo">
                            NexMed
                        </div>
                        
                        <button 
                            className="btn btn-primary"
                            onClick={() => navigate('/signup')}
                        >
                            Sign Up / Login
                        </button>
                    </div>
                </header>

                {/* Main Content */}
                <main className="landing-main">
                    {/* Hero Section */}
                    <section className="hero-section">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                Donate, Buy, or Rent
                                <span className="hero-title-highlight"> Medical Supplies</span>
                            </h1>
                            <p className="hero-description">
                                Empowering communities to share and access medical essentials — 
                                donate, buy, or rent with NexMed.
                            </p>
                            <button 
                                className="btn btn-get-started"
                                onClick={() => navigate('/signup')}
                            >
                                Get Started
                            </button>
                        </div>
                        
                        <div className="hero-image">
                            <div className="image-wrapper">
                                <img 
                                    src={medicalImage} 
                                    alt="Medical Supplies" 
                                    className="hero-img" 
                                />
                            </div>
                        </div>
                    </section>

                    {/* How It Works Section */}
                    <section className="how-it-works-section">
                        <div className="section-header">
                            <span className="section-badge">Simple Process</span>
                            <h2 className="section-title">How It Works</h2>
                        </div>
                        
                        <div className="steps-grid">
                            <div className="step-card">
                                <div className="step-number">01</div>
                                <h3>Sign Up</h3>
                                <p>Create your free account in minutes and join our caring community.</p>
                            </div>
                            
                            <div className="step-card">
                                <div className="step-number">02</div>
                                <h3>List or Browse</h3>
                                <p>List items you want to share or browse what others have available.</p>
                            </div>
                            
                            <div className="step-card">
                                <div className="step-number">03</div>
                                <h3>Connect & Share</h3>
                                <p>Connect with community members and arrange donation, sale, or rental.</p>
                            </div>
                            
                            <div className="step-card">
                                <div className="step-number">04</div>
                                <h3>Make an Impact</h3>
                                <p>Your contribution helps someone in need and reduces medical waste.</p>
                            </div>
                        </div>
                    </section>

                    {/* Features Section */}
                    <section className="features-section">
                        <div className="section-header">
                            <span className="section-badge">Why Choose Us</span>
                            <h2 className="section-title">Platform Features</h2>
                        </div>
                        
                        <div className="features-grid">
                            <div className="feature-card">
                                <div className="feature-icon">🩺</div>
                                <h3>Medical Equipment Sharing</h3>
                                <p>Share wheelchairs, oxygen concentrators, hospital beds, and more with those in need.</p>
                            </div>
                            
                            <div className="feature-card">
                                <div className="feature-icon">💊</div>
                                <h3>Medicine Redistribution</h3>
                                <p>Donate unused medicines safely through our verified redistribution program.</p>
                            </div>
                            
                            <div className="feature-card">
                                <div className="feature-icon">🤝</div>
                                <h3>Community Driven</h3>
                                <p>Built on trust and mutual support, connecting donors directly with recipients.</p>
                            </div>
                            
                            <div className="feature-card">
                                <div className="feature-icon">🔒</div>
                                <h3>Safe & Verified</h3>
                                <p>All items are verified and transactions are secured for peace of mind.</p>
                            </div>
                            
                            <div className="feature-card">
                                <div className="feature-icon">🌍</div>
                                <h3>Environmental Impact</h3>
                                <p>Reduce medical waste by giving unused supplies a second life.</p>
                            </div>
                            
                            <div className="feature-card">
                                <div className="feature-icon">⏱️</div>
                                <h3>Flexible Options</h3>
                                <p>Choose to donate, sell, or rent items based on your preference.</p>
                            </div>
                        </div>
                    </section>

                    {/* Call to Action Section */}
                    <section className="cta-section">
                        <div className="cta-content">
                            <h2>Ready to Make a Difference?</h2>
                            <p>Join thousands of community members who are already sharing and accessing medical supplies.</p>
                            <button 
                                className="btn btn-join"
                                onClick={() => navigate('/signup')}
                            >
                                Join the Community
                            </button>
                        </div>
                    </section>
                </main>
            </div>
        );
    }

    export default LandingPage;