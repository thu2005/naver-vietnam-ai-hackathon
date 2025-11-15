import mongoose from "mongoose";

// model is built based on AI generated ingredient information
const ingredientAISchema = new mongoose.Schema({
  inci_name: {
    type: String,
    required: true,
  },
  inci_normalized: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  summary: String,

  benefits: {
    type: [String],
    default: []
  },

  good_for: {
    type: [String],
    default: []
  },

  avoid_if: {
    type: [String],
    default: []
  },

}, { timestamps: true });

export default mongoose.model("IngredientAI", ingredientAISchema);
