/**
 * API Service for backend communication
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Generic request handler
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Don't set Content-Type for FormData (multipart)
    if (config.body instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Product Analysis APIs
  async analyzeProduct(frontImage, backImage, options = {}) {
    const formData = new FormData();

    if (frontImage) {
      // Convert base64 to File if needed
      if (typeof frontImage === "string" && frontImage.startsWith("data:")) {
        const file = this.dataURLtoFile(frontImage, "front-image.jpg");
        formData.append("frontImage", file);
      } else {
        formData.append("frontImage", frontImage);
      }
    }

    if (backImage) {
      if (typeof backImage === "string" && backImage.startsWith("data:")) {
        const file = this.dataURLtoFile(backImage, "back-image.jpg");
        formData.append("backImage", file);
      } else {
        formData.append("backImage", backImage);
      }
    }

    return this.request("/product-analyze/upload", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Product APIs
   */
  async getProducts(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/products?${queryParams}` : "/products";
    return this.request(endpoint);
  }

  async getProductById(productId) {
    return this.request(`/products/${productId}`);
  }

  async getProductsByUVIndex(uvIndex) {
    return this.request(`/products/uv?uvIndex=${uvIndex}`);
  }

  async getProductsBySkinType(skinType) {
    return this.request(`/products/skin-type?skinType=${skinType}`);
  }

  /**
   * Routine APIs
   */
  async getRoutines(filters = {}) {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/routines?${queryParams}` : "/routines";
    return this.request(endpoint);
  }

  /**
   * Weather APIs
   */
  async getWeatherRecommendations(location) {
    return this.request(`/weather?location=${encodeURIComponent(location)}`);
  }

  /**
   * Utility methods
   */
  dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }

  /**
   * Transform backend response to frontend format
   */
  transformAnalysisResponse(backendResponse) {
    if (!backendResponse?.data) {
      throw new Error("Invalid response format from backend");
    }

    const { product, ingredients, risk } = backendResponse.data;

    // Transform to match frontend expectations
    return {
      product: {
        name: product?.product_name || "Unknown Product",
        brand: product?.brand || "Unknown Brand",
        image:
          product?.image ||
          "https://images.unsplash.com/photo-1669200141274-38ae8632a86a",
        category: product?.category || "Skincare Product",
        benefits: product?.benefits || [
          "Skincare benefits will be analyzed",
          "Product features to be determined",
        ],
      },
      risk: {
        categories: {
          "no-risk": this.extractRiskCategory(ingredients, "low") || [],
          "low-risk": this.extractRiskCategory(ingredients, "medium") || [],
          "moderate-risk": this.extractRiskCategory(ingredients, "high") || [],
        },
      },
      ingredients: this.transformIngredients(ingredients) || [],
    };
  }

  extractRiskCategory(ingredients, riskLevel) {
    if (!ingredients || !Array.isArray(ingredients)) return [];

    return ingredients
      .filter((ing) => ing.safety_level === riskLevel)
      .map((ing) => ({
        name: ing.name,
        concentration: ing.concentration || "Not specified",
        reason:
          ing.safety_description || "No specific safety information available",
      }));
  }

  transformIngredients(ingredients) {
    if (!ingredients || !Array.isArray(ingredients)) return [];

    return ingredients.map((ing) => ({
      name: ing.name,
      concentration: ing.concentration || "0",
      description: ing.description || "Ingredient description not available",
      benefits: ing.benefits || ["Benefits to be analyzed"],
      usageNotes: ing.usage_notes || "Usage information not available",
      safetyInfo: ing.safety_description || null,
      riskLevel: this.mapSafetyLevel(ing.safety_level),
    }));
  }

  mapSafetyLevel(backendLevel) {
    const mapping = {
      low: "no-risk",
      medium: "low-risk",
      high: "moderate-risk",
    };
    return mapping[backendLevel] || "no-risk";
  }
}

export default new ApiService();
