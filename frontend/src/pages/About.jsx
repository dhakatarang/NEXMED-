/*

  AboutUs page -> (on navbar)

*/

import React from "react";
import "./About.css";
import aboutImage from "../assets/about.jpg";
import wheelchairImage from "../assets/wheelchair.jpg";

const About = () => {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Transforming Healthcare
            <span className="hero-title-highlight"> Through Sharing</span>
          </h1>
          <p className="hero-description">
            Join a community of care where medical resources find their way to those who need them most.
          </p>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="mission-header">
          <h2 className="mission-title">
            Making Healthcare Accessible
            <span className="title-highlight"> for Everyone</span>
          </h2>
          <div className="title-underline"></div>
        </div>
        <div className="mission-statement">
          <p className="mission-text">
            We believe that access to medical care shouldn't depend on financial circumstances. 
            Our platform connects donors with those in need, creating a sustainable ecosystem 
            of healthcare sharing.
          </p>
        </div>
      </div>

      {/* Feature 1 - Equipment Sharing */}
      <div className="feature-section">
        <div className="feature-content">
          <div className="feature-text">
            <h3 className="feature-title">
              Medical Equipment Sharing
            </h3>
            <p className="feature-description">
              Our innovative medical equipment sharing platform revolutionizes healthcare accessibility 
              by creating a sustainable ecosystem where underutilized medical devices find new purpose. 
              We bridge the gap between equipment owners and those in temporary need, transforming 
              idle resources into life-changing solutions. From wheelchairs and mobility aids to 
              advanced oxygen concentrators and diagnostic tools, our network ensures that quality 
              medical equipment reaches people when they need it most.
            </p>
          </div>
          
          <div className="feature-graphic">
            <div className="image-wrapper">
              <img 
                src={wheelchairImage} 
                alt="Medical Equipment Sharing" 
                className="feature-image"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Feature 2 - Medicine Redistribution */}
      <div className="feature-section">
        <div className="feature-content reversed">
          <div className="feature-text">
            <h3 className="feature-title">
              Medicine Redistribution
            </h3>
            <p className="feature-description">
              We facilitate the safe and regulated redistribution of unused medicines 
              to patients who cannot afford them. Our verification system ensures 
              all medications meet safety standards before reaching those in need.
              Through strategic partnerships with pharmacies and healthcare providers,
              we create a seamless channel for surplus medications to reach underserved communities.
              Our digital platform tracks every medication from donation to distribution,
              ensuring complete transparency and regulatory compliance at every step.
            </p>
          </div>
          
          <div className="feature-graphic">
            <div className="image-wrapper">
              <img 
                src={aboutImage} 
                alt="Medicine Redistribution" 
                className="feature-image"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Final Statement */}
      <div className="closing-section">
        <p className="closing-text">
          Join us in making healthcare accessible to everyone
        </p>
      </div>
    </div>
  );
};

export default About;