import mongoose from 'mongoose';
import dotenv from 'dotenv';
import IngredientCosing from '../models/ingredientCosing.js';
import IngredientRenude from '../models/IngredientRenude.js';
import IngredientAI from '../models/ingredientAI.js';
import SafetyDataEmbedding from '../models/SafetyDataEmbedding.js';

dotenv.config();

/**
 * Optimizes database indexes for faster queries
 */
async function optimizeDatabase() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-app';
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Helper function to create index safely
    async function createIndexSafely(collection, indexSpec, options = {}) {
      try {
        await collection.createIndex(indexSpec, options);
        console.log(`  ✓ Created index: ${JSON.stringify(indexSpec)}`);
      } catch (error) {
        if (error.code === 86) { // IndexKeySpecsConflict
          console.log(`  ℹ Index already exists: ${JSON.stringify(indexSpec)}`);
        } else if (error.codeName === 'IndexOptionsConflict') {
          console.log(`  ⚠ Index exists with different options: ${JSON.stringify(indexSpec)}`);
          console.log(`    Skipping to avoid conflicts`);
        } else {
          throw error;
        }
      }
    }

    console.log('Creating indexes for IngredientCosing...');
    await createIndexSafely(IngredientCosing.collection, { inci_name: 1 });
    await createIndexSafely(IngredientCosing.collection, { inci_normalized: 1 });
    
    console.log('Creating indexes for IngredientRenude...');
    await createIndexSafely(IngredientRenude.collection, { name: 1 });
    
    console.log('Creating indexes for IngredientAI...');
    await createIndexSafely(IngredientAI.collection, { name: 1 });
    
    console.log('Creating indexes for SafetyDataEmbedding...');
    await createIndexSafely(SafetyDataEmbedding.collection, { 'data.ingredient_name': 1 });
    
    console.log('\n✅ All indexes processed successfully');
    
    // Show index stats
    const cosingIndexes = await IngredientCosing.collection.indexes();
    const renudeIndexes = await IngredientRenude.collection.indexes();
    const aiIndexes = await IngredientAI.collection.indexes();
    const safetyIndexes = await SafetyDataEmbedding.collection.indexes();
    
    console.log('\nIndex Summary:');
    console.log('IngredientCosing:', cosingIndexes.length, 'indexes');
    console.log('IngredientRenude:', renudeIndexes.length, 'indexes');
    console.log('IngredientAI:', aiIndexes.length, 'indexes');
    console.log('SafetyDataEmbedding:', safetyIndexes.length, 'indexes');
    
    await mongoose.disconnect();
    console.log('\n✅ Database optimization complete');
  } catch (error) {
    console.error('❌ Error optimizing database:', error);
    process.exit(1);
  }
}

optimizeDatabase();
