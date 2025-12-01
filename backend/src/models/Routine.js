import mongoose from 'mongoose';

const routineStepSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }]
});

const routineSchema = new mongoose.Schema({
    name: { type: String, enum: ['morning', 'night'], required: true },
    steps: [routineStepSchema],
    skinType: { type: String, enum: ['combination', 'dry', 'oily', 'normal', 'sensitive'], required: true },
    strategy: { type: String, enum: ['minimal', 'complete', 'focus_treatment', 'focus_hydration', 'anti_aging'], required: true },
    priceBracket: { type: String, enum: ['budget', 'affordable', 'mid-range', 'premium', 'luxury', 'ultra-luxury'], required: false },
    maxPricePerProduct: { type: Number, required: false },
    totalProducts: { type: Number, required: false },
    totalPrice: { type: Number, required: true },
    avgRank: { type: Number, required: true }
}, { timestamps: true });

routineSchema.index({ skinType: 1, totalPrice: 1, avgRank: 1 });
routineSchema.index({ skinType: 1, strategy: 1, totalPrice: 1 });

export default mongoose.model('Routine', routineSchema);
