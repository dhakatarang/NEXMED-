// frontend/src/components/MedicalEquipmentVerify.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import './MedicalEquipmentVerify.css';

const MedicalEquipmentVerify = () => {
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [acceptedAnalysis, setAcceptedAnalysis] = useState(false);
  const [adjustedCondition, setAdjustedCondition] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve Gemini analysis data
    const storedData = sessionStorage.getItem('pendingEquipmentAnalysis');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setAnalysisData(parsedData);
      setAdjustedCondition(parsedData.geminiAnalysis?.overallCondition || 'good');
      // Clear after retrieval
      sessionStorage.removeItem('pendingEquipmentAnalysis');
    } else {
      // No data, redirect back
      navigate('/donate-rent');
    }
  }, [navigate]);

  const handleSubmitWithAnalysis = async () => {
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setMessage('Please login to continue');
        setTimeout(() => navigate('/login'), 2000);
        return;
      }

      const submitData = new FormData();
      submitData.append('itemType', 'medicalequipment');
      submitData.append('optionType', analysisData.equipmentData.optionType);
      submitData.append('name', analysisData.equipmentData.name);
      submitData.append('description', analysisData.equipmentData.description);
      submitData.append('quantity', analysisData.equipmentData.quantity);
      submitData.append('price', analysisData.equipmentData.price);
      submitData.append('rentPrice', analysisData.equipmentData.rentPrice);
      submitData.append('duration', analysisData.equipmentData.duration);
      submitData.append('condition', adjustedCondition);
      submitData.append('aiAnalysis', JSON.stringify(analysisData.geminiAnalysis));
      submitData.append('termsAccepted', 'true');

      const response = await API.post('/donaterent/add', submitData);

      // ✅ Replace with this
if (response.data.success) {
  const equipmentId = response.data.id;

  // Save AI analysis linked to this equipment
  try {
    await API.post('/equipment-scan/save-scan', {
      userId: JSON.parse(localStorage.getItem('user') || '{}')?.id,
      equipment_id: equipmentId,
      equipmentName: analysisData.equipmentData.name,
      confidence: analysisData.geminiAnalysis?.confidence,
      condition: adjustedCondition,
      details: JSON.stringify({
        summary: analysisData.geminiAnalysis?.summary,
        detailedAnalysis: analysisData.geminiAnalysis?.detailedAnalysis,
        recommendations: analysisData.geminiAnalysis?.recommendations,
      })
    });
    console.log('✅ AI analysis saved');
  } catch (err) {
    console.log('⚠️ Could not save AI analysis:', err.message);
    // Don't block the user — equipment was already saved
  }

  setMessage('Equipment added successfully!');
  setTimeout(() => {
    navigate('/medicalequipments');
  }, 2000);
}
      
      const equipmentId = response.data.id;

// Save AI analysis linked to this equipment ID
await API.post('/equipment-scan/save-scan', {
  userId: JSON.parse(localStorage.getItem('user'))?.id,
  equipmentName: analysisData.equipmentData.name,
  confidence: analysisData.geminiAnalysis?.confidence,
  condition: adjustedCondition,
  details: JSON.stringify({
    summary: analysisData.geminiAnalysis?.summary,
    detailedAnalysis: analysisData.geminiAnalysis?.detailedAnalysis,
    recommendations: analysisData.geminiAnalysis?.recommendations,
  }),
  equipment_id: equipmentId
});
    } catch (error) {
      console.error('Error submitting equipment:', error);
      setMessage(error.response?.data?.message || 'Error adding equipment');
    } finally {
      setLoading(false);
    }
  };

  if (!analysisData) {
    return (
      <div className="verify-loading">
        <div className="spinner"></div>
        <p>Loading analysis results...</p>
      </div>
    );
  }

  const analysis = analysisData.geminiAnalysis;

  return (
    <div className="equipment-verify-container">
      <div className="verify-header">
        <h1>AI Equipment Analysis Results</h1>
        <p>Review the AI-generated assessment before adding your equipment</p>
      </div>

      <div className="verify-content">
        {/* Image Preview */}
        {analysisData.imagePreview && (
          <div className="image-preview">
            <img src={analysisData.imagePreview} alt="Equipment preview" />
          </div>
        )}

        {/* AI Analysis Results */}
        <div className="ai-analysis-section">
          <h2>🤖 AI Condition Assessment</h2>
          
          <div className={`condition-badge ${analysis?.overallCondition}`}>
            Overall Condition: {analysis?.overallCondition?.toUpperCase()}
            {analysis?.confidence && ` (${analysis.confidence}% confidence)`}
          </div>

          <div className="analysis-details">
            <div className="detail-card">
              <h3>Physical Appearance</h3>
              <p>{analysis?.detailedAnalysis?.physicalAppearance}</p>
            </div>

            <div className="detail-card">
              <h3>Functionality Assessment</h3>
              <p>{analysis?.detailedAnalysis?.functionality}</p>
            </div>

            <div className="detail-card safety">
              <h3>⚠️ Safety Concerns</h3>
              <p>{analysis?.detailedAnalysis?.safetyConcerns || 'No major safety concerns identified'}</p>
            </div>

            <div className="detail-card">
              <h3>Cleanliness</h3>
              <p>{analysis?.detailedAnalysis?.cleanliness}</p>
            </div>

            <div className="detail-card">
              <h3>Missing Components</h3>
              <p>{analysis?.detailedAnalysis?.missingComponents || 'All components appear present'}</p>
            </div>

            <div className="detail-card">
              <h3>Maintenance Needs</h3>
              <p>{analysis?.detailedAnalysis?.maintenanceNeeds || 'Regular maintenance recommended'}</p>
            </div>
          </div>

          <div className="summary-section">
            <h3>Summary</h3>
            <p>{analysis?.summary}</p>
          </div>

          <div className="recommendations-section">
            <h3>📋 Recommendations</h3>
            <p>{analysis?.recommendations}</p>
          </div>

          <div className="additional-info">
            <div className="info-item">
              <span className="label">Estimated Lifespan:</span>
              <span className="value">{analysis?.estimatedLifespan}</span>
            </div>
            <div className="info-item">
              <span className="label">Safety Score:</span>
              <span className={`value safety-score-${analysis?.safetyScore > 70 ? 'good' : 'warning'}`}>
                {analysis?.safetyScore}/100
              </span>
            </div>
          </div>
        </div>

        {/* Manual Adjustment */}
        <div className="adjustment-section">
          <h3>Adjust Condition (if needed)</h3>
          <select 
            value={adjustedCondition} 
            onChange={(e) => setAdjustedCondition(e.target.value)}
            className="condition-select"
          >
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
            <option value="critical">Critical</option>
          </select>
        </div>

        {/* Confirmation */}
        <div className="confirmation-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={acceptedAnalysis}
              onChange={(e) => setAcceptedAnalysis(e.target.checked)}
            />
            <span>I confirm that the AI analysis is accurate and I agree to add this equipment</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            onClick={() => navigate('/donate-rent')} 
            className="cancel-btn"
          >
            Back
          </button>
          <button 
            onClick={handleSubmitWithAnalysis} 
            disabled={!acceptedAnalysis || loading}
            className="submit-btn"
          >
            {loading ? 'Adding Equipment...' : 'Confirm & Add Equipment'}
          </button>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicalEquipmentVerify;