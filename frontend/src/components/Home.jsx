import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MedicineCard from './MedicineCard';
import './Home.css';

const Home = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const navigate = useNavigate();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const response = await axios.post('http://localhost:5001/api/upload-medicine', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMedicines([response.data, ...medicines]);
      setSelectedFile(null);
      setPreviewUrl(null);
      // Clear file input
      document.getElementById('file-input').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setError('');
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please drop a valid image file');
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    document.getElementById('file-input').value = '';
  };

  const navigateToMedicines = () => {
    navigate('/medicines');
  };

  return (
    <div className="home-tracker-page">
      <div className="tracker-header">
        <h1>Medicine Expiry Tracker</h1>
        <p>Upload medicine images to automatically extract expiry dates and receive alerts before expiration</p>
      </div>

      <div className="tracker-content">
        {/* Upload Section */}
        <div className="upload-section">
          <h2>Upload Medicine Image</h2>
          
          <div 
            className={`upload-area ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              id="file-input"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input-hidden"
            />
            
            {!selectedFile ? (
              <div className="upload-prompt">
                <div className="upload-icon">📸</div>
                <button 
                  className="btn btn-primary"
                  onClick={() => document.getElementById('file-input').click()}
                >
                  Select Image
                </button>
                <p className="upload-hint">or drag and drop an image here</p>
                <p className="upload-note">Supports: JPG, PNG, GIF (Max 5MB)</p>
              </div>
            ) : (
              <div className="file-preview">
                <div className="preview-image">
                  <img src={previewUrl} alt="Preview" />
                </div>
                <div className="preview-details">
                  <p className="file-name">{selectedFile.name}</p>
                  <p className="file-size">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                  <div className="preview-actions">
                    <button 
                      className="btn btn-primary"
                      onClick={handleUpload}
                      disabled={uploading}
                    >
                      {uploading ? 'Processing...' : 'Upload & Extract'}
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={clearSelection}
                      disabled={uploading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {error && <div className="error-message">{error}</div>}
        </div>

        {/* Recently Added Section */}
        {medicines.length > 0 && (
          <div className="recent-section">
            <div className="section-header">
              <h2>Recently Added Medicines</h2>
              <button 
                className="btn btn-secondary"
                onClick={navigateToMedicines}
              >
                View All
              </button>
            </div>
            
            <div className="medicines-grid">
              {medicines.map(medicine => (
                <MedicineCard key={medicine.id} medicine={medicine} />
              ))}
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="info-section">
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">📅</div>
              <h3>Automatic Date Extraction</h3>
              <p>Our AI-powered system automatically detects and extracts expiry dates from medicine packaging</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">⏰</div>
              <h3>2-Month Alerts</h3>
              <p>Get notified when medicines are approaching expiry, giving you time to use or donate them</p>
            </div>
            
            <div className="info-card">
              <div className="info-icon">💊</div>
              <h3>Medicine Management</h3>
              <p>Keep track of all your medicines in one place with expiry status and quantity monitoring</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;