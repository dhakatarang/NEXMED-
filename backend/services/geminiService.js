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
   * @returns {Promise<Object>} - Analysis result with condition details
   */
  async analyzeEquipmentCondition(imagePath, equipmentName = 'medical equipment') {
    try {
      // Read image file and convert to base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare the prompt
      const prompt = `You are a medical equipment inspection expert. Analyze this image of a ${equipmentName} and provide a detailed condition assessment.

Please respond in the following JSON format:
{
  "overallCondition": "excellent|good|fair|poor|critical",
  "confidence": 0-100,
  "detailedAnalysis": {
    "physicalAppearance": "Description of visible condition including any rust, scratches, cracks, or wear",
    "functionality": "Assessment of likely functional status based on visual inspection",
    "safetyConcerns": "Any visible safety issues or concerns",
    "cleanliness": "Assessment of hygiene and cleanliness level",
    "missingComponents": "Any visibly missing or broken parts"
  },
  "summary": "Brief overall assessment (1-2 sentences)",
  "recommendations": "List of recommended actions or inspections needed"
}

Important: Be honest and objective. If the image quality is poor or you cannot see certain details, mention that in your analysis. Focus on visible defects, wear patterns, and potential issues.`;

      // Generate content with image
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image
          }
        }
      ]);

      const response = await result.response;
      const text = response.text();
      
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
   * Fallback parsing if JSON extraction fails
   */
  parseFallback(text) {
    // Extract key information from text response
    const conditionMap = {
      'excellent': /excellent/i,
      'good': /good/i,
      'fair': /fair/i,
      'poor': /poor/i,
      'critical': /critical|severe|damaged/i
    };
    
    let overallCondition = 'fair';
    for (const [condition, pattern] of Object.entries(conditionMap)) {
      if (pattern.test(text)) {
        overallCondition = condition;
        break;
      }
    }
    
    return {
      overallCondition: overallCondition,
      confidence: 70,
      detailedAnalysis: {
        physicalAppearance: text.substring(0, 200),
        functionality: "Analysis based on visual inspection",
        safetyConcerns: "See detailed notes",
        cleanliness: "See detailed notes",
        missingComponents: "None visibly missing"
      },
      summary: text.substring(0, 150),
      recommendations: "Professional inspection recommended"
    };
  }

  /**
   * Clean up temporary image file
   */
  cleanupImage(imagePath) {
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`Cleaned up image: ${imagePath}`);
      }
    } catch (error) {
      console.error(`Error cleaning up image ${imagePath}:`, error);
    }
  }
}

module.exports = new GeminiVisionService();