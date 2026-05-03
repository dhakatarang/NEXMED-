// backend/services/geminiVisionService.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');
const path = require('path');

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

class GeminiVisionService {
  constructor() {
    this.model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  }

  /**
   * Analyze equipment condition from image
   * @param {string} imagePath - Path to the uploaded image file
   * @param {string} equipmentName - Name of the equipment for context
   * @param {string} userDescription - User-provided description
   * @returns {Promise<Object>} - Analysis result with condition details
   */
  async analyzeEquipmentCondition(imagePath, equipmentName = 'medical equipment', userDescription = '') {
    try {
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        throw new Error(`Image file not found: ${imagePath}`);
      }
      
      // Read image file and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      const mimeType = this.getMimeType(imagePath);
      
      console.log(`📊 Analyzing image: ${path.basename(imagePath)}`);
      console.log(`📝 Equipment: ${equipmentName}`);
      
      // Prepare the prompt
      const prompt = `You are a certified medical equipment inspection expert with 20 years of experience. Analyze this image of a ${equipmentName} and provide a detailed professional condition assessment.

User provided description: ${userDescription || 'No description provided'}

Please respond in the following JSON format ONLY (no other text):
{
  "overallCondition": "excellent|good|fair|poor|critical",
  "confidence": 0-100,
  "detailedAnalysis": {
    "physicalAppearance": "Detailed description of visible physical condition including any rust, scratches, cracks, dents, discoloration, or wear patterns",
    "functionality": "Assessment of likely functional status based on visual inspection of moving parts, connections, and critical components",
    "safetyConcerns": "List any visible safety issues, potential hazards, or regulatory concerns",
    "cleanliness": "Assessment of hygiene level, presence of stains, dust, or biological residues",
    "missingComponents": "List any visibly missing, broken, or damaged parts",
    "maintenanceNeeds": "Identified maintenance or repair requirements"
  },
  "summary": "Concise professional summary (2-3 sentences) of the equipment's overall condition and usability",
  "recommendations": "Specific actionable recommendations for inspection, cleaning, repair, or refurbishment",
  "estimatedLifespan": "Estimated remaining useful life in months or years",
  "safetyScore": "Safety score out of 100"
}

Analysis Guidelines:
- Be objective and honest about defects and wear
- If image quality is poor, mention limitations
- Consider medical-grade standards and requirements
- Highlight any infection control concerns
- Note any modifications or non-original parts visible
- Assess if equipment appears safe for patient use`;

      // Generate content with image
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
      console.log('✅ Gemini analysis completed');
      
      // Parse JSON from response
      let analysis;
      try {
        // Try to extract JSON from the response text
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          analysis = this.parseFallback(text);
        }
      } catch (parseError) {
        console.error('Error parsing Gemini response:', parseError);
        analysis = this.parseFallback(text);
      }
      
      // Validate and normalize condition
      const validConditions = ['excellent', 'good', 'fair', 'poor', 'critical'];
      if (!validConditions.includes(analysis.overallCondition)) {
        analysis.overallCondition = 'fair';
      }
      
      return {
        success: true,
        analysis: analysis,
        rawResponse: text,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Gemini Vision API Error:', error);
      return {
        success: false,
        error: error.message,
        analysis: null
      };
    }
  }

  /**
   * Get MIME type from file extension
   */
  getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    return mimeTypes[ext] || 'image/jpeg';
  }

  /**
   * Fallback parsing if JSON extraction fails
   */
  parseFallback(text) {
    // Extract key information from text response
    const conditionMap = {
      'excellent': /excellent|perfect|like new|mint condition/i,
      'good': /good|decent|satisfactory|works well/i,
      'fair': /fair|acceptable|moderate wear|usable/i,
      'poor': /poor|bad|heavy wear|damaged/i,
      'critical': /critical|severe|unsafe|hazardous/i
    };
    
    let overallCondition = 'fair';
    let highestScore = 0;
    
    for (const [condition, pattern] of Object.entries(conditionMap)) {
      const matches = text.match(pattern);
      if (matches && matches.length > highestScore) {
        overallCondition = condition;
        highestScore = matches.length;
      }
    }
    
    // Extract confidence if present
    const confidenceMatch = text.match(/(\d{1,3})%\s*confidence/i);
    const confidence = confidenceMatch ? parseInt(confidenceMatch[1]) : 70;
    
    return {
      overallCondition: overallCondition,
      confidence: confidence,
      detailedAnalysis: {
        physicalAppearance: text.substring(0, 300),
        functionality: "Assessment based on visual inspection",
        safetyConcerns: "See detailed notes in analysis",
        cleanliness: "Standard cleanliness level observed",
        missingComponents: "None visibly missing",
        maintenanceNeeds: "Regular maintenance recommended"
      },
      summary: text.substring(0, 200),
      recommendations: "Professional in-person inspection recommended for accurate assessment",
      estimatedLifespan: "Unable to determine from image alone",
      safetyScore: 70
    };
  }

  /**
   * Clean up temporary image file
   */
  cleanupImage(imagePath) {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`🧹 Cleaned up image: ${imagePath}`);
      }
    } catch (error) {
      console.error(`Error cleaning up image ${imagePath}:`, error);
    }
  }
}

module.exports = new GeminiVisionService();