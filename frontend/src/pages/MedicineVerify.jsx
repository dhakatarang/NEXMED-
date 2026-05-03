// frontend/src/pages/MedicineVerify.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from '../../api';
import "./MedicineVerify.css";

const MedicineVerify = () => {
  const [ocrData, setOcrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [editedDetails, setEditedDetails] = useState({
    name: "",
    expiryDate: "",
    batchNumber: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve OCR data from sessionStorage
    const storedData = sessionStorage.getItem("pendingMedicineOCR");
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setOcrData(parsedData);
      setEditedDetails({
        name: parsedData.ocrResults?.medicineName || parsedData.medicineData.name || "",
        expiryDate: parsedData.ocrResults?.expiryDate || parsedData.medicineData.expiryDate || "",
        batchNumber: parsedData.ocrResults?.batchNumber || parsedData.medicineData.batchNumber || "",
      });
      // Clear after retrieval
      sessionStorage.removeItem("pendingMedicineOCR");
    } else {
      // No data, redirect back
      navigate("/donaterent");
    }
  }, [navigate]);

  const handleSubmit = async () => {
    setLoading(true);
    setMessage("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("Please login to continue");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const submitData = new FormData();
      submitData.append("itemType", "medicine");
      submitData.append("optionType", ocrData.medicineData.optionType);
      submitData.append("name", editedDetails.name);
      submitData.append("description", ocrData.medicineData.description);
      submitData.append("quantity", ocrData.medicineData.quantity);
      submitData.append("price", ocrData.medicineData.price || 0);
      submitData.append("expiryDate", editedDetails.expiryDate);
      submitData.append("batchNumber", editedDetails.batchNumber);
      submitData.append("termsAccepted", "true");

      // If there's an image, we need to send it again
      if (ocrData.imagePreview) {
        // Convert base64 or blob to file
        const response = await fetch(ocrData.imagePreview);
        const blob = await response.blob();
        submitData.append("image", blob, "medicine-image.jpg");
      }

      const response = await API.post('/donaterent/add', submitData);

      if (response.data.success) {
        setMessage("Medicine added successfully!");
        setTimeout(() => {
          navigate("/medicines");
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting medicine:", error);
      setMessage(error.response?.data?.message || "Error adding medicine");
    } finally {
      setLoading(false);
    }
  };

  if (!ocrData) {
    return (
      <div className="verify-loading">
        <div className="spinner"></div>
        <p>Loading OCR results...</p>
      </div>
    );
  }

  const ocrResults = ocrData.ocrResults;

  return (
    <div className="medicine-verify-container">
      <div className="verify-header">
        <h1>🔍 OCR Medicine Verification</h1>
        <p>Review and verify the extracted medicine information</p>
      </div>

      <div className="verify-content">
        {/* Image Preview */}
        {ocrData.imagePreview && (
          <div className="image-preview">
            <img src={ocrData.imagePreview} alt="Medicine preview" />
          </div>
        )}

        {/* OCR Extracted Results */}
        <div className="ocr-results-section">
          <h2>🤖 OCR Extracted Information</h2>

          <div className="extracted-info">
            <div className="info-card">
              <h3>Medicine Name</h3>
              <p className="extracted">{ocrResults?.medicineName || "Not detected"}</p>
              <div className="edit-field">
                <label>Edit Name:</label>
                <input
                  type="text"
                  value={editedDetails.name}
                  onChange={(e) =>
                    setEditedDetails({ ...editedDetails, name: e.target.value })
                  }
                  placeholder="Enter medicine name"
                />
              </div>
            </div>

            <div className="info-card">
              <h3>Expiry Date</h3>
              <p className="extracted">{ocrResults?.expiryDate || "Not detected"}</p>
              <div className="edit-field">
                <label>Edit Date:</label>
                <input
                  type="date"
                  value={editedDetails.expiryDate}
                  onChange={(e) =>
                    setEditedDetails({ ...editedDetails, expiryDate: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="info-card">
              <h3>Batch Number</h3>
              <p className="extracted">{ocrResults?.batchNumber || "Not detected"}</p>
              <div className="edit-field">
                <label>Edit Batch:</label>
                <input
                  type="text"
                  value={editedDetails.batchNumber}
                  onChange={(e) =>
                    setEditedDetails({ ...editedDetails, batchNumber: e.target.value })
                  }
                  placeholder="Enter batch number"
                />
              </div>
            </div>
          </div>

          {ocrResults?.extractedText && (
            <div className="extracted-text">
              <h3>Full OCR Text</h3>
              <pre>{ocrResults.extractedText}</pre>
            </div>
          )}
        </div>

        {/* Original Form Data */}
        <div className="original-data">
          <h3>📋 Your Provided Information</h3>
          <div className="data-grid">
            <div className="data-item">
              <span className="label">Name:</span>
              <span className="value">{ocrData.medicineData.name}</span>
            </div>
            <div className="data-item">
              <span className="label">Description:</span>
              <span className="value">{ocrData.medicineData.description}</span>
            </div>
            <div className="data-item">
              <span className="label">Quantity:</span>
              <span className="value">{ocrData.medicineData.quantity}</span>
            </div>
            <div className="data-item">
              <span className="label">Type:</span>
              <span className="value">{ocrData.medicineData.optionType}</span>
            </div>
            {ocrData.medicineData.price && (
              <div className="data-item">
                <span className="label">Price:</span>
                <span className="value">₹{ocrData.medicineData.price}</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirmation */}
        <div className="confirmation-section">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
            />
            <span>I confirm that the information above is accurate</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <button onClick={() => navigate("/donaterent")} className="cancel-btn">
            Back to Form
          </button>
          <button
            onClick={handleSubmit}
            disabled={!accepted || loading}
            className="submit-btn"
          >
            {loading ? "Adding Medicine..." : "Confirm & Add Medicine"}
          </button>
        </div>

        {message && (
          <div
            className={`message ${message.includes("successfully") ? "success" : "error"}`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedicineVerify;