import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

/**
 * Extracts product info (name, brand, category, benefits) from OCR text using NAVER LLM - OPTIMIZED
 * @param {string} ocrText - Raw OCR text from product packaging
 * @returns {Promise<Object>} Extracted product info
 */
export async function extractProductInfoFromTextService(ocrText) {
	if (!ocrText || typeof ocrText !== 'string') {
		return {
			name: '',
			brand: '',
			category: '',
			benefits: []
		};
	}

	const prompt = `Extract from OCR text and return JSON with: name (product name), brand, category (e.g. "Brightening Serum"), benefits (array of 2-3 strings).

OCR: ${ocrText.substring(0, 1000)}`; // Limit OCR text to 1000 chars for speed

	// Setup API credentials
	const __filename = fileURLToPath(import.meta.url);
	const __dirname = path.dirname(__filename);
	dotenv.config({ path: path.join(__dirname, '../../.env') });
	const apiKey = process.env.HYPER_CLOVA_API_KEY;
	const apiUrl = process.env.HYPER_CLOVA_API_URL;

	if (!apiKey || !apiUrl) {
		throw new Error('HYPER CLOVA API credentials not set');
	}

	try {
		const response = await axios.post(
			apiUrl,
			{
				messages: [
					{
						role: 'system',
						content: 'Extract product info as JSON.'
					},
					{
						role: 'user',
						content: prompt
					},
				],
				response_format: { "type": "json_object" },
				maxTokens: 300, // Reduced from 1000
				temperature: 0.2, // Lower for consistency
				topP: 0.8,
				repeatPenalty: 1.2
			},
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: 15000 // 15s timeout
			}
		);

		const content = response.data?.result?.message?.content || response.data?.message?.content;
		if (!content) {
			throw new Error('Invalid LLM response format');
		}

		const productData = JSON.parse(content);
		return {
			name: productData.name || '',
			brand: productData.brand || '',
			category: productData.category || '',
			benefits: Array.isArray(productData.benefits) ? productData.benefits : []
		};
	} catch (error) {
		console.error('Error calling HYPER CLOVA LLM for product info:', error.message);
		// Fallback: return empty fields
		return {
			name: '',
			brand: '',
			category: '',
			benefits: []
		};
	}
}