import React, { useState } from "react";
import axios from "axios";

const EquipmentScan = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [equipmentName, setEquipmentName] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setResult("");
      setAnalysis(null);
      setError("");
    }
  };

  const handleScan = async () => {
    if (!file) {
      setError("Please upload an image first!");
      return;
    }

    if (!equipmentName.trim()) {
      setError("Please enter equipment name!");
      return;
    }

    const formData = new FormData();
    formData.append("equipmentImage", file);
    formData.append("equipmentName", equipmentName);

    setLoading(true);
    setError("");
    
    try {
      const token = localStorage.getItem("token"); // Adjust based on your auth
      const response = await axios.post(
        "https://nexmed.onrender.com/api/equipment-scan/scan",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setAnalysis(response.data.analysis);
        setResult(response.data.analysis.summary);
      } else {
        setError(response.data.message || "Scan failed");
      }
    } catch (err) {
      console.error("Scan error:", err);
      setError(err.response?.data?.message || "Error during equipment scan");
    } finally {
      setLoading(false);
    }
  };

  const getConditionColor = (condition) => {
    const colors = {
      excellent: "text-green-600 bg-green-100",
      good: "text-blue-600 bg-blue-100",
      fair: "text-yellow-600 bg-yellow-100",
      poor: "text-orange-600 bg-orange-100",
      critical: "text-red-600 bg-red-100"
    };
    return colors[condition?.toLowerCase()] || "text-gray-600 bg-gray-100";
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 80) return "text-green-600";
    if (confidence >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          Equipment Condition Scanner 🩻
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Equipment Name
            </label>
            <input
              type="text"
              value={equipmentName}
              onChange={(e) => setEquipmentName(e.target.value)}
              placeholder="e.g., Wheelchair, Oxygen Concentrator, Hospital Bed"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Equipment Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {preview && (
            <div className="mb-4">
              <img 
                src={preview} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
            </div>
          )}

          <button
            onClick={handleScan}
            disabled={loading || !file || !equipmentName}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Analyzing Equipment...
              </span>
            ) : (
              "Scan Equipment with AI"
            )}
          </button>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
              ⚠️ {error}
            </div>
          )}
        </div>

        {analysis && (
          <div className="space-y-4">
            {/* Overall Condition Card */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold mb-4">AI Analysis Results</h2>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Overall Condition:</span>
                <span className={`px-3 py-1 rounded-full font-semibold ${getConditionColor(analysis.overallCondition)}`}>
                  {analysis.overallCondition?.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-600">Confidence Score:</span>
                <span className={`font-semibold ${getConfidenceColor(analysis.confidence)}`}>
                  {analysis.confidence}%
                </span>
              </div>
              <div className="border-t pt-4">
                <p className="text-gray-700">{analysis.summary}</p>
              </div>
            </div>

            {/* Detailed Analysis */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-bold text-lg mb-3">Detailed Analysis</h3>
              <div className="space-y-3">
                <div>
                  <span className="font-semibold text-gray-700">Physical Appearance:</span>
                  <p className="text-gray-600 mt-1">{analysis.detailedAnalysis.physicalAppearance}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Functionality Assessment:</span>
                  <p className="text-gray-600 mt-1">{analysis.detailedAnalysis.functionality}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Safety Concerns:</span>
                  <p className="text-gray-600 mt-1">{analysis.detailedAnalysis.safetyConcerns}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Cleanliness Level:</span>
                  <p className="text-gray-600 mt-1">{analysis.detailedAnalysis.cleanliness}</p>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Missing Components:</span>
                  <p className="text-gray-600 mt-1">{analysis.detailedAnalysis.missingComponents}</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="bg-blue-50 rounded-xl shadow-lg p-6 border border-blue-200">
              <h3 className="font-bold text-lg mb-2 flex items-center">
                <span className="text-2xl mr-2">💡</span>
                Recommendations
              </h3>
              <p className="text-gray-700">{analysis.recommendations}</p>
            </div>
          </div>
        )}

        {/* Guidance for better results */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-yellow-800 mb-2">📸 Tips for Best Results</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Take clear photos in good lighting</li>
            <li>• Capture multiple angles if possible</li>
            <li>• Ensure the entire equipment is visible</li>
            <li>• Focus on areas with visible wear or damage</li>
            <li>• Avoid blurry or dark images</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EquipmentScan;