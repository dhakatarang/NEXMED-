import React, { useState } from "react";

const MedicineScan = () => {
  const [image, setImage] = useState(null);
  const [text, setText] = useState("");

  const handleOCR = async () => {
    if (!image) return alert("Upload an image first!");
    // Simulate OCR result (for future Tesseract.js integration)
    setTimeout(() => {
      setText("Recognized Text: Paracetamol 500mg, Exp: 12/2026");
    }, 1500);
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Medicine OCR Scanner 💊</h1>
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-4 border p-2"
      />
      <br />
      <button
        onClick={handleOCR}
        className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
      >
        Extract Details
      </button>
      {text && <p className="mt-4 text-lg text-purple-600">{text}</p>}
    </div>
  );
};

export default MedicineScan;
