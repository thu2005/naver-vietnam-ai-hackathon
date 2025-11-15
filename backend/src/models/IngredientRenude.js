import mongoose from 'mongoose';
// model is built based on this dataset https://www.kaggle.com/datasets/amaboh/skin-care-product-ingredients-inci-list
const ingredientRenudeSchema = new mongoose.Schema({
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

  short_description: String,

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
  }

}, { timestamps: true });

export default mongoose.model('IngredientRenude', ingredientRenudeSchema);