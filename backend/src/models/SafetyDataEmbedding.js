import mongoose from 'mongoose';

const safetyDataEmbeddingSchema = new mongoose.Schema({
  ingredient_name: {
    type: String,
    required: true,
    index: true
  },
  
  embedding: {
    type: [Number],
    required: true
  },
  
  embedding_text: {
    type: String,
    required: true
  },
  
  risk: {
    type: String
  },

  details: {
    type: String
  }
  
}, {
  timestamps: true
});

safetyDataEmbeddingSchema.index({ ingredient_name: 'text', details: 'text' });

safetyDataEmbeddingSchema.virtual('display_name').get(function() {
  return this.details.split('|').map(s => s.trim()).join(' - ');
});

const SafetyDataEmbedding = mongoose.model('SafetyDataEmbedding', safetyDataEmbeddingSchema);

export default SafetyDataEmbedding;
