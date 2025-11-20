import IngredientAI from "../models/ingredientAI.js";
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { searchSafetyData, checkIngredientSafety } from './vectorSearch.service.js';
dotenv.config();

/**
 * Enriches ingredient names with full details from AI or LLM
 * Priority: IngredientAI -> Safety Data Vector Search (RAG) -> HYPER CLOVA LLM (with RAG context)
 * Note: This function assumes Renude lookup has already been done
 * @param {string[]} ingredientNames - Array of ingredient names to enrich (not found in Renude)
 * @returns {Promise<Array>} Array of enriched ingredient details
 */
export async function enrichIngredientsWithDetails(ingredientNames) {
  if (!ingredientNames || ingredientNames.length === 0) {
    return [];
  }

  // Step 1: Query IngredientAI for cached results
  const aiResults = await IngredientAI.find({
    name: { $in: ingredientNames }
  }).lean();

  const aiMap = new Map();
  aiResults.forEach(item => {
    aiMap.set(item.name, item);
  });

  // Step 2: Find still missing ingredients (need LLM or RAG)
  const stillMissing = ingredientNames.filter(name => !aiMap.has(name));

  // Step 3: Use RAG + LLM for remaining ingredients
  if (stillMissing.length > 0) {
    try {
      // Perform vector search for safety data (RAG retrieval)
      const ragContext = await retrieveSafetyContext(stillMissing);
      
      // Call HYPER CLOVA LLM with RAG context and cache results
      const llmResults = await fetchIngredientFromLLMWithRAG(stillMissing, ragContext);
      
      // Cache LLM results to IngredientAI DB
      for (let idx = 0; idx < llmResults.length; idx++) {
        const llmResult = llmResults[idx];
        const ingredientName = stillMissing[idx];

        const doc = {
          name: llmResult.name || llmResult.inci_name || ingredientName,
          description: llmResult.description || llmResult.summary || '',
          benefits: Array.isArray(llmResult.benefits) ? llmResult.benefits : [],
          good_for: llmResult.good_for || [],
          risk_level: llmResult.risk_level || 'Unknown',
          reason: llmResult.reason || ''
        };
        aiMap.set(ingredientName, doc);
        
        // Upsert to IngredientAI DB
        try {
          await IngredientAI.updateOne(
            { name: doc.name },
            { $set: doc },
            { upsert: true }
          );
        } catch (dbError) {
          console.error('Failed to cache ingredient to IngredientAI:', doc.name, dbError.message);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ingredients from LLM with RAG:', error.message);
      // Add minimal fallback for all missing ingredients
      stillMissing.forEach(ingredientName => {
        aiMap.set(ingredientName, {
          name: ingredientName,
          description: 'Information not available',
          benefits: [],
          good_for: [],
          risk_level: 'Unknown',
          reason: 'LLM fetch failed'
        });
      });
    }
  }

  // Step 4: Return results in original order, only front-end fields
  const enrichedIngredients = ingredientNames.map(name => {
    const doc = aiMap.get(name);
    if (!doc) return null;
    return {
      name: doc.name,
      description: doc.description,
      benefits: doc.benefits,
      good_for: doc.good_for,
      risk_level: doc.risk_level,
      reason: doc.reason
    };
  }).filter(Boolean);

  return enrichedIngredients;
}

/**
 * Retrieve safety context using RAG (Retrieval-Augmented Generation) - OPTIMIZED with parallel processing
 * @param {string[]} ingredientNames - Array of ingredient names
 * @returns {Promise<Object>} Map of ingredient name -> safety context
 */
async function retrieveSafetyContext(ingredientNames) {
  const contextMap = {};
  
  try {
    // OPTIMIZATION: Perform all vector searches in parallel instead of sequentially
    const searchPromises = ingredientNames.map(ingredientName => 
      searchSafetyData(ingredientName, 2, 0.5) // Reduced from 3 to 2 for speed
        .then(safetyResults => ({ ingredientName, safetyResults }))
        .catch(err => {
          console.error(`Safety search failed for ${ingredientName}:`, err.message);
          return { ingredientName, safetyResults: [] };
        })
    );
    
    const allResults = await Promise.all(searchPromises);
    
    // Build context map from results
    allResults.forEach(({ ingredientName, safetyResults }) => {
      if (safetyResults.length > 0) {
        contextMap[ingredientName] = {
          has_safety_concerns: true,
          matched_substances: safetyResults.map(result => ({
            name: result.data.ingredient_name,
            details: result.data.details,
            cas_no: result.data.cas_no,
            risk_level: result.data.risk_level,
            similarity: result.similarity
          })),
          highest_similarity: safetyResults[0].similarity
        };
      } else {
        contextMap[ingredientName] = {
          has_safety_concerns: false,
          matched_substances: [],
          highest_similarity: 0
        };
      }
    });
  } catch (error) {
    console.error('Error retrieving safety context:', error.message);
    // Return empty context on error
    ingredientNames.forEach(name => {
      contextMap[name] = {
        has_safety_concerns: false,
        matched_substances: [],
        highest_similarity: 0
      };
    });
  }
  
  return contextMap;
}

/**
 * Fetches ingredient information from HYPER CLOVA LLM with RAG context
 * @param {string[]} ingredientNames - Array of ingredient names
 * @param {Object} ragContext - Safety context from vector search
 * @returns {Promise<Array>} LLM-generated ingredient details
 */
async function fetchIngredientFromLLMWithRAG(ingredientNames, ragContext) {
  const apiKey = process.env.HYPER_CLOVA_API_KEY;
  const apiUrl = process.env.HYPER_CLOVA_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('HYPER CLOVA API credentials not set');
  }

  const BATCH_SIZE = 10;
  const batches = [];
  for (let i = 0; i < ingredientNames.length; i += BATCH_SIZE) {
    batches.push(ingredientNames.slice(i, i + BATCH_SIZE));
  }

  // Process all batches in parallel
  const batchPromises = batches.map(batch => processBatch(batch, ragContext, apiKey, apiUrl));
  const batchResults = await Promise.all(batchPromises);
  
  // Flatten results
  return batchResults.flat();
}

async function processBatch(batch, ragContext, apiKey, apiUrl) {
  // Build context-aware prompt for this batch only
  let contextSection = '';
  for (const ingredientName of batch) {
    const context = ragContext[ingredientName];
    if (context?.has_safety_concerns && context.highest_similarity > 0.6) {
      const topMatch = context.matched_substances[0];
      contextSection += `\n"${ingredientName}": ${topMatch.name} (${(topMatch.similarity * 100).toFixed(0)}% match, ${topMatch.risk_level})`;
    }
  }

  const prompt = `Analyze these skincare ingredients and return a JSON array with objects containing: name, description (1 sentence), benefits (array of 3 strings), good_for (array from: oily, dry, combination, sensitive, normal, acne, aging, pigmentation), risk_level (no-risk/low-risk/moderate-risk/high-risk/banned), reason (2 sentences).
${contextSection ? '\nSafety alerts:' + contextSection : ''}
Ingredients: ${batch.join(', ')}`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'system',
            content: 'Expert skincare analyst. Return concise JSON array.'
          },
          {
            role: 'user',
            content: prompt
          },
        ],
        response_format: { "type": "json_object" },
        maxTokens: Math.min(150 * batch.length, 2000), 
        temperature: 0.2,
        topP: 0.8,
        repeatPenalty: 1.2
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30s timeout per batch
      }
    );

    const content = response.data?.result?.message?.content || response.data?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response format');
    }

    const parsed = JSON.parse(content);
    const results = Array.isArray(parsed) ? parsed : (parsed.ingredients || [parsed]);
    
    // Ensure we have results for all ingredients in batch
    return batch.map((name, idx) => results[idx] || {
      name,
      description: 'Information not available',
      benefits: [],
      good_for: [],
      risk_level: 'Unknown',
      reason: 'LLM response incomplete'
    });
  } catch (error) {
    console.error('Batch LLM call failed:', error.message);
    // Return fallback for entire batch
    return batch.map(name => ({
      name,
      description: 'Information not available',
      benefits: [],
      good_for: [],
      risk_level: 'Unknown',
      reason: 'LLM error: ' + error.message
    }));
  }
}

/**
 * Fetches only risk_level and reason for ingredients from HYPER CLOVA LLM
 * Used for seeding Renude database where other fields already exist
 * @param {string[]} ingredientNames - Array of ingredient names
 * @returns {Promise<Array>} Array of objects with name, risk_level, and reason
 */
export async function fetchRiskAssessmentFromLLM(ingredientNames) {
  const apiKey = process.env.HYPER_CLOVA_API_KEY;
  const apiUrl = process.env.HYPER_CLOVA_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('HYPER CLOVA API credentials not set');
  }

  // Accepts array of ingredient names
  if (!Array.isArray(ingredientNames)) {
    ingredientNames = [ingredientNames];
  }

  const prompt = `For each of the following skincare ingredients, return a JSON array where each object has ONLY these fields:
  - name: The ingredient name (should match the input name)
  - risk_level: One of ['no-risk', 'low-risk', 'moderate-risk', 'high-risk', 'unknown'] indicating the safety risk of the ingredient
  - reason: A brief explanation (1-2 sentences) for the assigned risk level
Ingredients:
${ingredientNames.map((name, i) => `${i + 1}. ${name}`).join('\n')}
Return a JSON array of objects, one for each ingredient, in the same order as listed above. Do not include any extra fields.`;

  try {
    const response = await axios.post(
      apiUrl,
      {
        messages: [
          {
            role: 'system',
            content: 'You are a skincare ingredient safety expert. Provide accurate risk assessments in JSON format.'
          },
          {
            role: 'user',
            content: prompt
          },
        ],
        response_format: { "type": "json_object" },
        maxTokens: 1000,
        temperature: 0.3,
        topP: 0.8,
        repeatPenalty: 1.2
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data?.result?.message?.content || response.data?.message?.content;
    if (!content) {
      throw new Error('Invalid LLM response format');
    }

    // Try direct JSON parsing first
    try {
      const ingredientData = JSON.parse(content);
      // If not an array, wrap in array
      return Array.isArray(ingredientData) ? ingredientData : [ingredientData];
    } catch (directParseError) {
      // Fallback: extract JSON array/object with regex
      const jsonMatch = content.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in LLM response');
      }
      const ingredientData = JSON.parse(jsonMatch[0]);
      return Array.isArray(ingredientData) ? ingredientData : [ingredientData];
    }
  } catch (error) {
    console.error('Error calling HYPER CLOVA LLM for risk assessment:', error.message);
    throw error;
  }
}
