import axios from "axios";
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import * as fuzz from "fuzzball";
import FormData from "form-data";
import { fileURLToPath } from 'url';

// Configuration constants
const OCR_CONFIG = {
  VERSION: "V2",
  RESULT_TYPE: "json",
  DEFAULT_FORMAT: 'png',
  DEFAULT_LANG: 'ko'
};

const __filename = fileURLToPath(import.meta.url);

const FUZZY_MATCH_THRESHOLD = 85;

/**
 * Calls the Naver OCR API with the provided image
 * @param {Object} config - OCR configuration
 * @param {string} config.secretKey - API secret key
 * @param {string} config.apiUrl - API endpoint URL
 * @param {string} config.imagePath - Path to the image file
 * @param {string} config.imageFormat - Image format (default: 'png')
 * @param {string} config.lang - Language code (default: 'ko')
 * @returns {Promise<Object>} OCR response data
 */
export async function callNaverOcr({
  secretKey, 
  apiUrl, 
  imagePath, 
  imageFormat = OCR_CONFIG.DEFAULT_FORMAT, 
  lang = OCR_CONFIG.DEFAULT_LANG
}) {
  if (!secretKey || !apiUrl || !imagePath) {
    throw new Error('Missing required parameters: secretKey, apiUrl, and imagePath are required');
  }

  const form = new FormData();
  const message = {
    version: OCR_CONFIG.VERSION,
    requestId: `${Date.now()}`,
    timestamp: Date.now(),
    images: [{
      format: imageFormat,
      name: path.basename(imagePath),
      data: null,
      url: null
    }],
    lang: lang,
    resultType: OCR_CONFIG.RESULT_TYPE
  };

  form.append('message', JSON.stringify(message));
  form.append('file', fs.createReadStream(imagePath));

  try {
    const response = await axios({
      method: 'post',
      url: apiUrl,
      headers: {
        'X-OCR-SECRET': secretKey,
        ...form.getHeaders() // This will now work
      },
      data: form,
      maxBodyLength: Infinity,
      maxContentLength: Infinity
    });
    return response.data;
  } catch (err) {
    console.error('Error calling OCR API:', err.response?.data || err);
    throw new Error(`OCR API call failed: ${err.message}`);
  }
}

/**
 * Extracts all text from OCR JSON response
 * @param {Object} ocrJson - OCR response JSON
 * @returns {string} Combined text from all fields
 */
export function extractAllText(ocrJson) {
  if (!ocrJson?.images) {
    console.warn('No images found in OCR response');
    return '';
  }

  const texts = [];
  for (const img of ocrJson.images) {
    for (const field of img.fields || []) {
      if (field.inferText) {
        texts.push(field.inferText.trim());
      }
    }
  }
  return texts.join(" ");
}

/**
 * Extracts ingredients block from full text using pattern matching
 * @param {string} fullText - Full OCR text
 * @returns {string} Extracted ingredients text
 */
export function extractIngredientsBlock(fullText) {
  if (!fullText || typeof fullText !== 'string') {
    return '';
  }

  const stopwords = [
    "Directions", "Caution", "Warning", "How to use", "Storage", 
    "주의", "사용방법", "용량", "화장품책임판매업자"
  ];
  
  const ingredientsPattern = /(ingredients?|성분|成分)[\s:：\-]*([A-Za-z0-9,.\-\s()%\/]+)/i;
  const match = fullText.match(ingredientsPattern);

  let ingredientsText = "";
  if (match && match[2]) {
    ingredientsText = match[2];
  } else {
    // Fallback: look for comma-separated list pattern
    const alternativeMatch = fullText.match(/([A-Z][a-z]+\s?[A-Za-z0-9\-\(\)%]*,){5,}/);
    if (alternativeMatch) {
      ingredientsText = alternativeMatch[0];
    }
  }

  // Remove content after stop words
  for (const stopword of stopwords) {
    const stopIndex = ingredientsText.toLowerCase().indexOf(stopword.toLowerCase());
    if (stopIndex !== -1) {
      ingredientsText = ingredientsText.slice(0, stopIndex);
    }
  }

  return ingredientsText.trim();
}

/**
 * Cleans and splits ingredient list into individual ingredients
 * @param {string} text - Raw ingredients text
 * @returns {string[]} Array of cleaned ingredient names
 */
export function cleanIngredientList(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  return text
    .split(/[;,]/)
    .map((ingredient) => ingredient.replace(/[^A-Za-z0-9\-\s()%/]/g, "").trim())
    .filter((ingredient) => ingredient.length > 1);
}

/**
 * Loads OCR response data from JSON file
 * @param {string} jsonPath - Path to JSON file
 * @returns {Object} Parsed OCR data
 */
function loadOcrData(jsonPath) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    if (!data.images?.[0]?.fields) {
      throw new Error('Invalid OCR data format');
    }
    return data;
  } catch (error) {
    throw new Error(`Failed to load OCR data from ${jsonPath}: ${error.message}`);
  }
}

/**
 * Sorts OCR fields by position (top-to-bottom, left-to-right)
 * @param {Array} fields - OCR field array
 * @returns {Array} Sorted fields
 */
function sortFieldsByPosition(fields) {
  return fields.sort((a, b) => {
    const aY = a.boundingPoly?.vertices?.[0]?.y || 0;
    const bY = b.boundingPoly?.vertices?.[0]?.y || 0;
    
    if (aY !== bY) return aY - bY;
    
    const aX = a.boundingPoly?.vertices?.[0]?.x || 0;
    const bX = b.boundingPoly?.vertices?.[0]?.x || 0;
    return aX - bX;
  });
}

/**
 * Extracts ingredients text using header detection patterns
 * @param {string} fullText - Complete OCR text
 * @returns {string} Cleaned ingredients text
 */
function extractIngredientsFromText(fullText) {
  // Header patterns for ingredient detection
  const headerPatterns = [
    /전\s*성\s*분/i,
    /성\s*분/i,
    /ingredients?/i,
    /full\s*ingredients?/i,
    /ingredient\s*list/i,
  ];

  let startIndex = null;
  for (const pattern of headerPatterns) {
    const match = pattern.exec(fullText);
    if (match) {
      startIndex = match.index;
      break;
    }
  }

  let ingredientsText = startIndex !== null ? fullText.slice(startIndex) : fullText;

  // End markers to stop ingredient extraction
  const endMarkers = [
    '용량', '사용법', '화장품책임판매업자', '피엘인터내셔널',
    'directions', 'how to use', 'usage', 'manufacturer', 'distributor', 'volume'
  ];
  
  const splitPattern = new RegExp(endMarkers.join('|'), 'i');
  ingredientsText = ingredientsText.split(splitPattern)[0];

  // Clean up the text
  ingredientsText = ingredientsText.replace(
    /(전\s*성\s*분|ingredients?|full\s*ingredients?|ingredient\s*list)/gi, 
    ''
  );
  ingredientsText = ingredientsText.replace(/\s+/g, ' ').trim();

  return ingredientsText;
}

/**
 * Loads INCI ingredient list from CSV file
 * @param {string} csvPath - Path to CSV file
 * @returns {Promise<string[]>} Array of INCI ingredient names
 */
export async function loadINCIList(csvPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(csvPath)) {
      return reject(new Error(`CSV file not found: ${csvPath}`));
    }

    const ingredients = [];

    fs.createReadStream(csvPath)
      .pipe(csv())
      .on('data', (row) => {
        const inciName = row['INCI name'];
        if (inciName && typeof inciName === 'string' && inciName.trim()) {
          ingredients.push(inciName.trim().toLowerCase());
        }
      })
      .on('end', () => {
        if (ingredients.length === 0) {
          console.warn('No ingredients found. Ensure column "INCI name" exists.');
        }
        resolve(ingredients);
      })
      .on('error', (error) => {
        reject(new Error(`Failed to read CSV: ${error.message}`));
      });
  });
}

/**
 * Performs fuzzy matching of extracted tokens against INCI ingredient list
 * @param {string[]} tokens - Extracted ingredient tokens
 * @param {string[]} ingredientList - INCI ingredient database
 * @returns {string[]} Array of matched ingredients
 */
export function matchIngredientsWithDatabase(tokens, ingredientList) {
  const foundIngredients = [];
  
  for (const token of tokens) {
    if (!token || token.length < 2) continue;
    
    try {
      const matches = fuzz.extract(token, ingredientList, {
        scorer: fuzz.ratio,
        returnObjects: false,
        limit: 1
      });
      
      if (matches && matches.length > 0) {
        const [match, score] = matches[0];
        if (score > FUZZY_MATCH_THRESHOLD) {
          foundIngredients.push(match);
        }
      }
    } catch (error) {
      console.warn(`Fuzzy matching failed for token "${token}":`, error.message);
    }
  }
  
  return foundIngredients;
}

/**
 * Extracts cosmetic ingredients from an image using OCR and INCI database matching
 * @param {string} secretKey - API secret key
 * @param {string} apiUrl - CLOVA OCR API URL
 * @param {string} imagePath - Path to image file
 * @param {string} imageFormat - Image format (optional, defaults to 'png')
 * @returns {Promise<Object>} Extraction results
 */
export async function extractIngredients(secretKey, apiUrl, imagePath, imageFormat = 'png') {
  try {
    if (!secretKey || !apiUrl || !imagePath) {
      throw new Error('Missing required parameters: secretKey, apiUrl, and imagePath are required');
    }

    // Get CSV path for INCI ingredient database
    const csvPath = path.join(path.dirname(__filename), 'cosing_ingredients.csv');

    // Call CLOVA OCR API
    const ocrData = await callNaverOcr({
      secretKey,
      apiUrl,
      imagePath,
      imageFormat
    });

    if (!ocrData?.images?.[0]?.fields) {
      throw new Error('Invalid OCR response format');
    }

    // Sort and extract text from OCR fields
    const sortedFields = sortFieldsByPosition(ocrData.images[0].fields);
    const fullText = sortedFields.map(field => field.inferText || '').join(' ');
    

    
    // Extract ingredients section
    const ingredientsText = extractIngredientsFromText(fullText);
    
    // Load INCI ingredient database
    const ingredientList = await loadINCIList(csvPath);
    
    // Tokenize and clean ingredients text
    const tokens = ingredientsText
      .split(',')
      .map(token => token.trim().toLowerCase())
      .filter(Boolean);
    
    
    // Match against INCI database
    const foundIngredients = matchIngredientsWithDatabase(tokens, ingredientList);
    
    return {
      success: true,
      text_length: fullText.length,
      ingredients_found: foundIngredients.length,
      ingredients: foundIngredients
    };
    
  } catch (error) {
    console.error('Error extracting ingredients:', error.message);
    return {
      success: false,
      error: error.message,
      ingredients_found: 0,
      ingredients: []
    };
  }
}
