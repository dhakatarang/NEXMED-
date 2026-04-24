import React, { useState } from "react";

const EquipmentScan = () => {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState("");

  const handleScan = async () => {
    if (!file) return alert("Please upload an image first!");
    // Simulate AI detection (for future ML integration)
    setTimeout(() => {
      setResult("Detected: Minor rusting on handle and slight scratches.");
    }, 1500);
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Equipment Condition Scanner 🩻</h1>
      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4 border p-2"
      />
      <br />
      <button
        onClick={handleScan}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
      >
        Scan Equipment
      </button>
      {result && <p className="mt-4 text-lg text-green-600">{result}</p>}
    </div>
  );
};

export default EquipmentScan;
