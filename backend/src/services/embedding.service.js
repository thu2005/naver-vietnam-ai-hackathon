import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Generate embeddings using NAVER HyperCLOVA X Embedding API
 * @param {string|string[]} texts - Single text or array of texts to embed
 * @returns {Promise<number[]|number[][]>} Embedding vector(s)
 */
export async function generateEmbedding(texts) {
  const apiKey = process.env.HYPER_CLOVA_EMBEDDING_API_KEY;
  const apiUrl = process.env.HYPER_CLOVA_EMBEDDING_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error('NAVER HyperCLOVA Embedding API credentials not set');
  }

  if (typeof texts !== 'string' || !texts.trim()) {
    throw new Error('Input to generateEmbedding must be a non-empty string');
  }

  try {
    const response = await axios.post(
      apiUrl,
      {
        text: texts
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    // Handle response format from NAVER HyperCLOVA X
    const embeddings = response.data?.result?.embedding || response.data?.embedding || response.data?.embeddings;
    if (!embeddings) {
      throw new Error('Invalid embedding response format');
    }
    return embeddings;
  } catch (error) {
    if (error.response) {
      console.error('NAVER Embedding API Error:', {
        status: error.response.status,
        data: error.response.data
      });
    } else {
      console.error('Error generating embeddings:', error.message);
    }
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First embedding vector
 * @param {number[]} vecB - Second embedding vector
 * @returns {number} Similarity score (0-1, higher is more similar)
 */
export function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    throw new Error('Invalid vectors for similarity calculation');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (normA * normB);
}

/**
 * Find top-k most similar items based on embedding similarity
 * @param {number[]} queryEmbedding - Query embedding vector
 * @param {Array<{embedding: number[], data: any}>} items - Items with embeddings
 * @param {number} topK - Number of top results to return
 * @param {number} threshold - Minimum similarity threshold (0-1)
 * @returns {Array<{data: any, similarity: number}>} Top similar items
 */
export function findTopSimilar(queryEmbedding, items, topK = 5, threshold = 0.0) {
  const results = items.map(item => ({
    data: item.data,
    similarity: cosineSimilarity(queryEmbedding, item.embedding)
  }));

  return results
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);
}

/**
 * Batch generate embeddings with rate limiting
 * @param {string[]} texts - Array of texts to embed
 * @param {number} batchSize - Number of texts per batch
 * @param {number} delayMs - Delay between batches in milliseconds
 * @returns {Promise<number[][]>} Array of embedding vectors
 */
export async function batchGenerateEmbeddings(texts, batchSize = 10, delayMs = 500) {
  const results = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    console.log(`Processing embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(texts.length / batchSize)}`);
    // Run requests in parallel for this batch
    const batchResults = await Promise.all(
      batch.map(async (text, idx) => {
        try {
          return await generateEmbedding(text);
        } catch (error) {
          console.error(`Error embedding text at batch index ${i + idx}:`, error.message);
          return null;
        }
      })
    );
    results.push(...batchResults);
    // Delay between batches to respect rate limits
    if (i + batchSize < texts.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  return results;
}
