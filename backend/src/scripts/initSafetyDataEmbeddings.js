import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import SafetyDataEmbedding from '../models/SafetyDataEmbedding.js';
import { batchGenerateEmbeddings } from '../services/embedding.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Initialize Safety Data Embeddings from JSON file
 * This script:
 * 1. Loads cosmetic_safety_data_final.json
 * 2. Generates embeddings for each entry using NAVER HyperCLOVA X
 * 3. Stores embeddings in MongoDB for fast vector search
 */

async function initSafetyDataEmbeddings() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skincare-db');
    console.log('Connected to MongoDB');

    // Load safety data JSON
    const jsonPath = path.join(__dirname, '../utils/cosmetic_safety_data_final.json');
    console.log(`Loading safety data from: ${jsonPath}`);
    
    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const safetyData = JSON.parse(rawData);
    console.log(`Loaded ${safetyData.length} safety data entries`);

    // Drop old id index if it exists
    try {
      await SafetyDataEmbedding.collection.dropIndex('id_1');
      console.log('Dropped old id index');
    } catch (error) {
      // Index doesn't exist, ignore
    }

    // Check if data already exists
    const existingCount = await SafetyDataEmbedding.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing embeddings`);
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise(resolve => {
        rl.question('Do you want to delete and recreate all embeddings? (yes/no): ', resolve);
      });
      rl.close();

      if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
        console.log('Deleting existing embeddings...');
        await SafetyDataEmbedding.deleteMany({});
        console.log('Deleted existing embeddings');
      } else {
        console.log('Keeping existing embeddings. Exiting...');
        process.exit(0);
      }
    }

    // Prepare texts for embedding
    console.log('Preparing texts for embedding...');
    const textsToEmbed = safetyData.map(item => {
      // Create rich text combining all fields for better semantic search
      return `${item.ingredient_name}: ${item.details}`;
    });

    // Generate embeddings in batches
    console.log('Generating embeddings using NAVER HyperCLOVA X...');
    console.log('This may take several minutes depending on the data size...');
    
    const embeddings = await batchGenerateEmbeddings(textsToEmbed, 5, 1000); // 5 items per batch, 1 second delay
    console.log(`Generated ${embeddings.length} embeddings`);

    // Prepare documents for insertion
    const documents = safetyData.map((item, index) => {
      if (!embeddings[index]) {
        console.warn(`Warning: No embedding generated for item ${index + 1}: ${item.ingredient_name}`);
        return null;
      }

      return {
        ingredient_name: item.ingredient_name,
        details: item.details || '',
        embedding: embeddings[index],
        embedding_text: textsToEmbed[index],
        risk: item.risk || 'banned'
      };
    }).filter(Boolean); // Remove null entries

    // Insert into database
    console.log(`Inserting ${documents.length} documents into database...`);
    
    if (documents.length > 0) {
      // Insert in batches to avoid memory issues
      const batchSize = 100;
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        await SafetyDataEmbedding.insertMany(batch);
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
      }
      
      console.log(`✓ Successfully inserted ${documents.length} safety data embeddings`);
    } else {
      console.log('⚠ No valid documents to insert');
    }

    // Create indexes
    console.log('Creating indexes...');
    await SafetyDataEmbedding.createIndexes();
    console.log('✓ Indexes created');

    // Display statistics
    const stats = await SafetyDataEmbedding.aggregate([
      {
        $group: {
          _id: '$risk',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log('\n=== Database Statistics ===');
    console.log(`Total entries: ${documents.length}`);
    stats.forEach(stat => {
      console.log(`${stat._id}: ${stat.count}`);
    });

    console.log('\n✓ Initialization complete!');
    console.log('Use testRAGSystem.js to test vector search functionality.');
    
  } catch (error) {
    console.error('Error initializing safety data embeddings:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initSafetyDataEmbeddings()
  .then(() => {
    console.log('Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
