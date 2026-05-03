// backend/services/ocrService.js
const { createWorker } = require('tesseract.js');
const fs = require('fs');
const path = require('path');

async function processOCR(imagePath) {
    try {
        // Check if file exists
        if (!fs.existsSync(imagePath)) {
            throw new Error(`Image file not found: ${imagePath}`);
        }

        console.log('Starting OCR processing for:', imagePath);
        
        // Create a worker
        const worker = await createWorker('eng');
        
        // Configure worker for better medicine text recognition
        await worker.setParameters({
            tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789/-:. ',
            tessedit_pageseg_mode: '6', // Uniform block of text
        });
        
        // Recognize text
        const { data: { text } } = await worker.recognize(imagePath);
        
        // Terminate worker
        await worker.terminate();
        
        console.log('OCR completed. Text length:', text.length);
        return text;
    } catch (error) {
        console.error('OCR processing error:', error);
        throw new Error(`OCR failed: ${error.message}`);
    }
}

function extractMedicineDetails(text) {
    console.log('Extracting details from text...');
    
    const expiryDate = extractExpiryDate(text);
    const medicineName = extractMedicineName(text);
    const batchNumber = extractBatchNumber(text);

    return { 
        expiryDate, 
        medicineName, 
        batchNumber,
        extractedText: text.substring(0, 500) // First 500 chars for preview
    };
}

function extractExpiryDate(text) {
    const datePatterns = [
        /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
        /\b(EXP:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}))\b/gi,
        /\b(Expiry:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}))\b/gi,
        /\b(Exp\. Date:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}))\b/gi,
        /\b(Expiry\s*Date:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}))\b/gi,
        /\b(\d{2,4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/g,
        /\b(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\b/gi,
        /\b(Expires:\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}))\b/gi
    ];

    for (const pattern of datePatterns) {
        const matches = text.match(pattern);
        if (matches && matches[0]) {
            let date = matches[0].replace(/EXP:\s*|Expiry:\s*|Exp\. Date:\s*|Expires:\s*/gi, '').trim();
            
            // Basic date format normalization
            if (date.includes('/')) {
                const parts = date.split('/');
                if (parts[2] && parts[2].length === 2) {
                    parts[2] = '20' + parts[2];
                    date = parts.join('/');
                }
            }
            console.log('Found expiry date:', date);
            return date;
        }
    }

    console.log('No expiry date found, using default (1 year from now)');
    // Return a default date 1 year from now if no date found
    const defaultDate = new Date();
    defaultDate.setFullYear(defaultDate.getFullYear() + 1);
    return defaultDate.toISOString().split('T')[0];
}

function extractMedicineName(text) {
    // Split into lines and clean
    const lines = text.split('\n')
        .filter(line => line.trim().length > 3)
        .filter(line => !line.match(/expiry|exp|batch|lot|manufacturer|mg|ml|tablet|capsule|price|mrp|manufactured|date|address|www|http|@|phone|fax|email/i))
        .filter(line => !line.match(/^\d+$|^\d+\.\d+$/)); // Filter out pure numbers
    
    // Look for common medicine name patterns
    let medicineName = null;
    
    // Try to find a line that looks like a medicine name
    for (const line of lines) {
        // Check if line contains medicine-like words
        if (line.match(/tablet|capsule|injection|syrup|drop|ointment|cream|gel/i)) {
            medicineName = line.trim();
            break;
        }
        // Check if line has proper length for a name (3-50 chars) and starts with capital letter
        if (line.length >= 3 && line.length <= 50 && /^[A-Z]/.test(line) && !line.includes(' ')) {
            medicineName = line.trim();
            break;
        }
        // First line that looks like a name
        if (!medicineName && line.length >= 3 && line.length <= 60 && !line.includes('http')) {
            medicineName = line.trim();
        }
    }
    
    const name = medicineName || lines[0]?.trim() || 'Unknown Medicine';
    console.log('Extracted medicine name:', name);
    return name;
}

function extractBatchNumber(text) {
    const batchPatterns = [
        /Batch[:]?\s*([A-Z0-9\-]+)/i,
        /Lot[:]?\s*([A-Z0-9\-]+)/i,
        /B\.No[:]?\s*([A-Z0-9\-]+)/i,
        /Batch\s*No[:]?\s*([A-Z0-9\-]+)/i,
        /B\.No\.\s*([A-Z0-9\-]+)/i,
        /Lot\s*No[:]?\s*([A-Z0-9\-]+)/i,
        /Batch\s*Number[:]?\s*([A-Z0-9\-]+)/i,
        /BN[:]?\s*([A-Z0-9\-]+)/i
    ];

    for (const pattern of batchPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
            const batch = match[1];
            console.log('Extracted batch number:', batch);
            return batch;
        }
    }

    console.log('No batch number found');
    return 'N/A';
}

module.exports = {
    processOCR,
    extractMedicineDetails
};