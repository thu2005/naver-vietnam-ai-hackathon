import { runOcrService, getOcrTextFromData } from '../services/ocr.service.js';
import { extractIngredientsFromTextService } from '../services/ingredientExtract.service.js';
import { extractProductInfoFromTextService } from '../services/productInfoExtract.service.js';
import { summarizeBenefitsFromIngredients } from '../services/benefitSummarization.service.js';
import { calculateSuitableScore } from '../services/calcSuitableScore.service.js';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Handles product analysis from front and back images
 * @param {Request} req
 * @param {Response} res
 */
export const productAnalyzeFromImages = async (req, res) => {
  try {
    if (req.aborted) {
      console.log('Request was aborted by client');
      return;
    }

    const frontImageFile = req.files?.frontImage?.[0];
    const backImageFile = req.files?.backImage?.[0];
    let user_skin = req.body.userSkin;
    if (typeof user_skin === 'string') {
      user_skin = [user_skin];
    }

    if (!frontImageFile || !backImageFile) {
      return res.status(400).json({ error: 'Both front and back images are required.' });
    }

    req.on('aborted', () => {
      console.log('Client disconnected during processing');
    });

    res.setHeader('Connection', 'keep-alive');
    const frontImagePath = path.resolve(frontImageFile.path);
    const backImagePath = path.resolve(backImageFile.path);
    const secretKey = process.env.OCR_SECRET_KEY;
    const apiUrl = process.env.OCR_API_URL;
    if (!secretKey || !apiUrl) {
      return res.status(500).json({ error: 'OCR API credentials are not set in environment variables.' });
    }


    const [frontOcrData, backOcrData] = await Promise.all([
      runOcrService(secretKey, apiUrl, frontImagePath),
      runOcrService(secretKey, apiUrl, backImagePath)
    ]);

    if (req.aborted) {
      console.log('Request aborted after OCR');
      return;
    }

    // Get OCR text from both images
    const frontOcrText = getOcrTextFromData(frontOcrData);
    const backOcrText = getOcrTextFromData(backOcrData);

    const [productInfo, ingredientResult] = await Promise.all([
      extractProductInfoFromTextService(frontOcrText),
      extractIngredientsFromTextService(backOcrText)
    ]);

    // Check if still connected after extraction
    if (req.aborted) {
      console.log('Request aborted after text extraction');
      return;
    }
    
    // OPTIMIZATION: Process risk grouping, suitability, and benefits in parallel
    
    // Risk grouping (fast, synchronous)
    const riskLevels = ['no-risk', 'low-risk', 'moderate-risk', 'high-risk'];
    const groupedByRisk = ingredientResult.reduce((acc, ingredient) => {
      const riskLevel = ingredient.risk_level || 'Unknown';
      if (!acc[riskLevel]) {
        acc[riskLevel] = [];
      }
      acc[riskLevel].push({
        name: ingredient.name,
        reason: ingredient.reason
      });
      return acc;
    }, {});
    riskLevels.forEach(level => {
      if (!groupedByRisk[level]) {
        groupedByRisk[level] = [];
      }
    });

    // Calculate suitability and summarize benefits in parallel
    const [suitabilityScores, summarizedBenefits] = await Promise.all([
      Promise.resolve(
        Array.isArray(user_skin) && user_skin.length > 0
          ? calculateSuitableScore(ingredientResult, user_skin)
          : null
      ),
      summarizeBenefitsFromIngredients(ingredientResult)
    ]);
    
    
    // Enrich product info by combining original benefits with ingredient-based benefits
    const enrichedProductInfo = {
        ...productInfo,
        benefits: [...productInfo.benefits, ...summarizedBenefits]
    };
    
    if (req.aborted) {
      console.log('Request aborted before sending response');
      return;
    }


    res.json({
        status: 'success',
        data: {
            product: enrichedProductInfo,
            suitable: suitabilityScores,
            risk: groupedByRisk,
            ingredients: ingredientResult
        }
    });
  } catch (err) {
    if (!req.aborted && !res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
}