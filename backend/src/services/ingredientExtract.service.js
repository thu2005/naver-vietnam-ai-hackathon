import IngredientCosing from "../models/ingredientCosing.js";
import IngredientRenude from "../models/IngredientRenude.js";
import { extractIngredientsFromText, cleanAndSplitIngredients, matchIngredientsWithFuzzy } from "../utils/ocrLogic.js";
import { enrichIngredientsWithDetails } from "./ingredientEnrichment.service.js";
import { ingredientCache } from "../utils/cache.js";

// Cache ingredient list to avoid repeated DB queries
let cachedCosingList = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 3600000; // 1 hour

// Ingredient extraction from OCR text - OPTIMIZED with caching
export async function extractIngredientsFromTextService(ocrText) {
  if (!ocrText) throw new Error('No OCR text provided');
  
  const ingredientsBlock = extractIngredientsFromText(ocrText);
  const tokens = cleanAndSplitIngredients(ingredientsBlock);

  const now = Date.now();
  if (!cachedCosingList || (now - cacheTimestamp) > CACHE_DURATION) {
    console.log('[CACHE] Refreshing Cosing ingredient list...');
    const ingredientDocs = await IngredientCosing.find({}, 'inci_name').lean();
    cachedCosingList = ingredientDocs.map(d => d.inci_name).filter(Boolean);
    cacheTimestamp = now;
  } else {
    console.log('[CACHE] Using cached Cosing ingredient list');
  }

  const matchedNames = await matchIngredientsWithFuzzy(tokens, cachedCosingList, 75);


  const cacheKeys = matchedNames.map(name => `ingredient:${name}`);
  const cachedResults = [];
  const uncachedNames = [];

  matchedNames.forEach(name => {
    const cached = ingredientCache.get(`ingredient:${name}`);
    if (cached) {
      cachedResults.push(cached);
    } else {
      uncachedNames.push(name);
    }
  });

  if (cachedResults.length > 0) {
    console.log(`[CACHE] Found ${cachedResults.length} ingredients in cache`);
  }

  let dbResults = [];
  if (uncachedNames.length > 0) {
    console.log(`[DB] Querying ${uncachedNames.length} ingredients from database`);
    const RenudeFields = 'name description benefits good_for risk_level reason';
    const renudeResults = await IngredientRenude.find({
      name: { $in: uncachedNames }
    }, RenudeFields).lean();
    
    const renudeMap = new Map();
    renudeResults.forEach(item => {
      renudeMap.set(item.name, item);
      // Cache the result
      ingredientCache.set(`ingredient:${item.name}`, item);
    });

    // Find missing ingredients that need enrichment
    const missingIngredients = uncachedNames.filter(name => !renudeMap.has(name));

    // Enrich only missing ingredients with LLM
    if (missingIngredients.length > 0) {
      console.log(`[LLM] Enriching ${missingIngredients.length} missing ingredients`);
      const enrichedMissing = await enrichIngredientsWithDetails(missingIngredients);
      enrichedMissing.forEach(item => {
        renudeMap.set(item.name, item);
        // Cache the enriched result
        ingredientCache.set(`ingredient:${item.name}`, item);
      });
    }

    dbResults = uncachedNames.map(name => renudeMap.get(name)).filter(Boolean);
  }

  // Combine cached and DB results in original order
  const allResults = new Map();
  cachedResults.forEach(item => allResults.set(item.name, item));
  dbResults.forEach(item => allResults.set(item.name, item));

  const ingredientDetails = matchedNames.map(name => {
    const item = allResults.get(name);
    if (!item) return null;
    
    return {
      name: item.name,
      description: item.description || '',
      benefits: item.benefits || [],
      good_for: item.good_for || [],
      risk_level: item.risk_level || 'Unknown',
      reason: item.reason || ''
    };
  }).filter(Boolean);

  return ingredientDetails;
}
