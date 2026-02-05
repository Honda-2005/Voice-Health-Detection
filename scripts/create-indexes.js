/**
 * Database Index Configuration
 * Optimizes query performance with strategic indexes
 */

import mongoose from 'mongoose';
import User from './backend/models/User.js';
import Prediction from './backend/models/Prediction.js';
import Recording from './backend/models/Recording.js';

/**
 * Create database indexes for optimal performance
 */
export async function createIndexes() {
    console.log('Creating database indexes...');

    try {
        // User indexes
        await User.collection.createIndex({ email: 1 }, { unique: true });
        await User.collection.createIndex({ role: 1 });
        await User.collection.createIndex({ isVerified: 1 });
        await User.collection.createIndex({ createdAt: -1 });
        console.log('✓ User indexes created');

        // Prediction indexes
        await Prediction.collection.createIndex({ userId: 1, createdAt: -1 });
        await Prediction.collection.createIndex({ recordingId: 1 });
        await Prediction.collection.createIndex({ status: 1 });
        await Prediction.collection.createIndex({ 'result.condition': 1 });
        await Prediction.collection.createIndex({ userId: 1, status: 1 });
        await Prediction.collection.createIndex({ createdAt: -1 });
        console.log('✓ Prediction indexes created');

        // Recording indexes
        await Recording.collection.createIndex({ userId: 1, uploadDate: -1 });
        await Recording.collection.createIndex({ filename: 1 });
        await Recording.collection.createIndex({ uploadDate: -1 });
        console.log('✓ Recording indexes created');

        // Compound indexes for complex queries
        await Prediction.collection.createIndex(
            { userId: 1, 'result.condition': 1, createdAt: -1 },
            { name: 'user_condition_date' }
        );
        console.log('✓ Compound indexes created');

        console.log('✅ All database indexes created successfully');
    } catch (error) {
        console.error('✗ Index creation error:', error);
        throw error;
    }
}

/**
 * List all indexes
 */
export async function listIndexes() {
    const userIndexes = await User.collection.indexes();
    const predictionIndexes = await Prediction.collection.indexes();
    const recordingIndexes = await Recording.collection.indexes();

    console.log('\n📊 Database Indexes:\n');
    console.log('User Indexes:', JSON.stringify(userIndexes, null, 2));
    console.log('\nPrediction Indexes:', JSON.stringify(predictionIndexes, null, 2));
    console.log('\nRecording Indexes:', JSON.stringify(recordingIndexes, null, 2));
}

/**
 * Run if called directly
 */
if (import.meta.url === `file://${process.argv[1]}`) {
    const mongoUri = process.env.MONGODB_URL;

    mongoose.connect(mongoUri)
        .then(async () => {
            console.log('Connected to MongoDB');
            await createIndexes();
            await listIndexes();
            await mongoose.connection.close();
            console.log('\nMongoDB connection closed');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}

export default { createIndexes, listIndexes };
