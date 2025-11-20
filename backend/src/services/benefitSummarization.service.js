import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
dotenv.config();

/**
 * Summarizes benefits from ingredient list using NAVER Hyper CLOVA LLM - OPTIMIZED
 * @param {Array<Object>} ingredients - Array of ingredient objects with benefits
 * @returns {Promise<Array<string>>} Summarized benefits
 */
export async function summarizeBenefitsFromIngredients(ingredients) {
	if (!Array.isArray(ingredients) || ingredients.length === 0) {
		return [];
	}

	// Extract all benefits from ingredients
	const allBenefits = ingredients
		.flatMap(ingredient => ingredient.benefits || [])
		.filter(benefit => benefit && benefit.trim().length > 0);

	if (allBenefits.length === 0) {
		return [];
	}

	// OPTIMIZATION: Limit benefits and create concise prompt
	const limitedBenefits = allBenefits.slice(0, 20); // Take only first 20
	const benefitsList = limitedBenefits.join(', ');
	
	const prompt = `Summarize these skincare benefits into 3-5 key points (each 5-8 words): ${benefitsList}
Return JSON: {"benefits": ["...", "...", "..."]}`;

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
						content: 'Summarize skincare benefits concisely as JSON.'
					},
					{
						role: 'user',
						content: prompt
					},
				],
				response_format: { "type": "json_object" },
				maxTokens: 200, // Reduced from 500
				temperature: 0.4,
				topP: 0.8,
				repeatPenalty: 1.2
			},
			{
				headers: {
					'Authorization': `Bearer ${apiKey}`,
					'Content-Type': 'application/json'
				},
				timeout: 10000 // 10s timeout
			}
		);

		const content = response.data?.result?.message?.content || response.data?.message?.content;
		if (!content) {
			throw new Error('Invalid LLM response format');
		}

		const result = JSON.parse(content);
		return Array.isArray(result.benefits) ? result.benefits : [];
	} catch (error) {
		console.error('Error calling HYPER CLOVA LLM for benefit summarization:', error.message);
		// Fallback: return top 3 unique benefits
		return [...new Set(allBenefits)].slice(0, 3);
	}
}
