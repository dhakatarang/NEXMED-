// Add this component inside your MedicalEquipmentDetails component
// Add near the Condition display section

const [scanResult, setScanResult] = useState(null);
const [scanning, setScanning] = useState(false);
const [scanImage, setScanImage] = useState(null);

const handleScanEquipment = async (imageFile) => {
  const formData = new FormData();
  formData.append("equipmentImage", imageFile);
  formData.append("equipmentName", equipment.name);

  setScanning(true);
  try {
    const token = localStorage.getItem("token");
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
      setScanResult(response.data.analysis);
      showMessage("AI scan completed!", "success");
    }
  } catch (error) {
    showMessage("Scan failed: " + (error.response?.data?.message || "Unknown error"), "error");
  } finally {
    setScanning(false);
  }
};

// Add this UI section near the Condition display
<div className="info-item">
  <span className="info-label">AI Condition Analysis</span>
  <div className="mt-2">
    <label className="block text-sm text-gray-600 mb-1">Upload for AI Scan</label>
    <input
      type="file"
      accept="image/*"
      onChange={(e) => {
        if (e.target.files[0]) {
          setScanImage(e.target.files[0]);
          handleScanEquipment(e.target.files[0]);
        }
      }}
      className="text-sm border rounded p-1"
    />
    {scanning && (
      <div className="mt-2 text-blue-600 text-sm">
        <span className="inline-block animate-spin mr-2">⏳</span>
        AI is analyzing the equipment condition...
      </div>
    )}
    {scanResult && !scanning && (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-start mb-2">
          <span className="font-semibold">AI Assessment:</span>
          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
            scanResult.overallCondition === 'excellent' ? 'bg-green-100 text-green-700' :
            scanResult.overallCondition === 'good' ? 'bg-blue-100 text-blue-700' :
            scanResult.overallCondition === 'fair' ? 'bg-yellow-100 text-yellow-700' :
            'bg-red-100 text-red-700'
          }`}>
            {scanResult.overallCondition?.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-gray-700">{scanResult.summary}</p>
        <details className="mt-2 text-xs text-gray-600">
          <summary className="cursor-pointer">View detailed analysis</summary>
          <div className="mt-2 space-y-1">
            <p><strong>Physical:</strong> {scanResult.detailedAnalysis.physicalAppearance}</p>
            <p><strong>Functionality:</strong> {scanResult.detailedAnalysis.functionality}</p>
            <p><strong>Safety:</strong> {scanResult.detailedAnalysis.safetyConcerns}</p>
            <p><strong>Recommendation:</strong> {scanResult.recommendations}</p>
          </div>
        </details>
      </div>
    )}
  </div>
</div>