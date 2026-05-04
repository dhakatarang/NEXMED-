import React, { useState } from 'react';
import axios from 'axios';

const TestOCR = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
    console.log(`[${type.toUpperCase()}]`, message);
  };

  const getBaseUrl = () => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:5001';
    }
    return 'https://nexmed-backend.onrender.com';
  };

  const BASE_URL = getBaseUrl();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      addLog(`File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
      setSelectedFile(file);
      setError(null);
      setResult(null);
    }
  };

  const testBackendConnection = async () => {
    addLog('Testing backend connection...');
    try {
      const response = await axios.get(`${BASE_URL}/health`);
      addLog(`✅ Backend connected! Status: ${response.status}`, 'success');
      return true;
    } catch (err) {
      addLog(`❌ Backend connection failed: ${err.message}`, 'error');
      return false;
    }
  };

  const testOCRDirectly = async () => {
    if (!selectedFile) {
      addLog('❌ Please select an image first', 'error');
      return;
    }

    setLoading(true);
    setError(null);
    addLog('Starting OCR test...');

    // Test 1: Backend connection
    const isConnected = await testBackendConnection();
    if (!isConnected) {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      addLog('❌ No authentication token found. Please login first.', 'error');
      setLoading(false);
      return;
    }
    addLog('✅ Authentication token found');

    const formData = new FormData();
    formData.append('image', selectedFile);

    addLog(`Sending request to: ${BASE_URL}/api/medicines/ocr-process`);
    addLog(`Image size: ${(selectedFile.size / 1024).toFixed(2)} KB`);

    try {
      const response = await axios.post(`${BASE_URL}/api/medicines/ocr-process`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 60000 // 60 second timeout
      });

      addLog(`✅ Response received! Status: ${response.status}`, 'success');
      addLog(`Response data: ${JSON.stringify(response.data, null, 2)}`, 'success');
      setResult(response.data);
      
    } catch (err) {
      addLog(`❌ Error: ${err.message}`, 'error');
      
      if (err.response) {
        addLog(`Status: ${err.response.status}`, 'error');
        addLog(`Response data: ${JSON.stringify(err.response.data, null, 2)}`, 'error');
        setError(err.response.data);
      } else if (err.request) {
        addLog('No response received from server', 'error');
        setError({ message: 'Server not responding' });
      } else {
        addLog(`Request error: ${err.message}`, 'error');
        setError({ message: err.message });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>OCR Debug Tool</h1>
      
      {/* Status Banner */}
      <div style={{ 
        background: '#f0f0f0', 
        padding: '10px', 
        borderRadius: '5px', 
        marginBottom: '20px' 
      }}>
        <strong>Backend URL:</strong> {BASE_URL}
        <br />
        <strong>Auth Status:</strong> {localStorage.getItem('token') ? '✅ Logged in' : '❌ Not logged in'}
      </div>

      {/* File Upload */}
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="file" 
          accept="image/*" 
          onChange={handleFileChange}
          style={{ marginBottom: '10px', display: 'block' }}
        />
        <button 
          onClick={testOCRDirectly} 
          disabled={loading || !selectedFile}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Testing OCR...' : 'Test OCR'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{ 
          background: '#fee', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          borderLeft: '4px solid #ef4444'
        }}>
          <h3 style={{ color: '#ef4444', margin: '0 0 10px 0' }}>Error</h3>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(error, null, 2)}
          </pre>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div style={{ 
          background: '#e6f7e6', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px',
          borderLeft: '4px solid #10b981'
        }}>
          <h3 style={{ color: '#10b981', margin: '0 0 10px 0' }}>OCR Results</h3>
          
          {result.ocrResults && (
            <div>
              <p><strong>Medicine Name:</strong> {result.ocrResults.name || 'Not detected'}</p>
              <p><strong>Batch Number:</strong> {result.ocrResults.batchNumber || 'Not detected'}</p>
              <p><strong>Expiry Date:</strong> {result.ocrResults.expiryDate || 'Not detected'}</p>
              <p><strong>Confidence:</strong> {result.ocrResults.confidence || 0}%</p>
            </div>
          )}
          
          {result.extractedText && (
            <details>
              <summary>Extracted Text (Raw)</summary>
              <pre style={{ 
                background: '#f0f0f0', 
                padding: '10px', 
                borderRadius: '5px',
                overflow: 'auto',
                maxHeight: '200px'
              }}>
                {result.extractedText}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Logs */}
      <div style={{ marginTop: '20px' }}>
        <h3>Debug Logs</h3>
        <div style={{ 
          background: '#1e1e1e', 
          color: '#d4d4d4', 
          padding: '10px', 
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {logs.length === 0 ? (
            <div>No logs yet. Click "Test OCR" to start.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} style={{ 
                marginBottom: '5px',
                color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : '#d4d4d4'
              }}>
                [{log.timestamp}] {log.message}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestOCR;