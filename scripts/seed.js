/**
 * Database Seed Script
 * Creates sample data for testing
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './backend-nodejs/models/User.js';
import Recording from './backend-nodejs/models/Recording.js';
import Prediction from './backend-nodejs/models/Prediction.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URL, {
      dbName: process.env.MONGODB_DB_NAME || 'voice_health_detection',
    });

    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Recording.deleteMany({}),
      Prediction.deleteMany({}),
    ]);

    console.log('Cleared existing data');

    // Create sample users
    const users = await User.create([
      {
        email: 'john@example.com',
        password: 'Password123',
        fullName: 'John Doe',
        phone: '+1234567890',
        dateOfBirth: new Date('1980-01-15'),
        gender: 'male',
        medicalInfo: {
          height: 180,
          weight: 75,
          conditions: [],
          medications: [],
        },
        isEmailVerified: true,
      },
      {
        email: 'jane@example.com',
        password: 'Password123',
        fullName: 'Jane Smith',
        phone: '+0987654321',
        dateOfBirth: new Date('1985-05-20'),
        gender: 'female',
        medicalInfo: {
          height: 165,
          weight: 60,
          conditions: ['asthma'],
          medications: ['albuterol'],
        },
        isEmailVerified: true,
      },
      {
        email: 'admin@example.com',
        password: 'AdminPass123',
        fullName: 'Admin User',
        role: 'admin',
        isEmailVerified: true,
      },
    ]);

    console.log(`Created ${users.length} users`);

    // Create sample recordings
    const recordings = await Recording.create([
      {
        userId: users[0]._id,
        audioFile: {
          filename: 'recording_1.wav',
          contentType: 'audio/wav',
          fileId: new mongoose.Types.ObjectId(),
          size: 524288,
          duration: 10,
        },
        metadata: {
          sampleRate: 44100,
          channels: 1,
          bitDepth: 16,
          format: 'wav',
        },
        features: {
          mfcc: Array(13).fill(0).map(() => Math.random()),
          pitch: 120 + Math.random() * 40,
          energy: 0.5 + Math.random() * 0.3,
          zeroCrossingRate: 0.05 + Math.random() * 0.05,
          spectralCentroid: 2000 + Math.random() * 1000,
          spectralRolloff: 4000 + Math.random() * 2000,
        },
        status: 'completed',
      },
      {
        userId: users[0]._id,
        audioFile: {
          filename: 'recording_2.wav',
          contentType: 'audio/wav',
          fileId: new mongoose.Types.ObjectId(),
          size: 262144,
          duration: 5,
        },
        metadata: {
          sampleRate: 44100,
          channels: 1,
          bitDepth: 16,
          format: 'wav',
        },
        features: {
          mfcc: Array(13).fill(0).map(() => Math.random()),
          pitch: 130 + Math.random() * 35,
          energy: 0.4 + Math.random() * 0.35,
          zeroCrossingRate: 0.06 + Math.random() * 0.04,
          spectralCentroid: 2200 + Math.random() * 900,
          spectralRolloff: 4200 + Math.random() * 1800,
        },
        status: 'completed',
      },
    ]);

    console.log(`Created ${recordings.length} recordings`);

    // Create sample predictions
    const predictions = await Prediction.create([
      {
        userId: users[0]._id,
        recordingId: recordings[0]._id,
        condition: 'healthy',
        severity: 'none',
        confidence: 0.92,
        probability: {
          healthy: 0.92,
          parkinsons: 0.06,
          other: 0.02,
        },
        symptoms: [
          {
            name: 'Voice clarity',
            score: 95,
            description: 'Normal voice clarity detected',
          },
        ],
        recommendations: [
          'Continue regular health monitoring',
          'Maintain healthy lifestyle',
        ],
      },
      {
        userId: users[0]._id,
        recordingId: recordings[1]._id,
        condition: 'healthy',
        severity: 'none',
        confidence: 0.88,
        probability: {
          healthy: 0.88,
          parkinsons: 0.10,
          other: 0.02,
        },
        symptoms: [
          {
            name: 'Voice stability',
            score: 87,
            description: 'Good voice stability',
          },
        ],
        recommendations: [
          'Maintain current health routine',
        ],
      },
    ]);

    console.log(`Created ${predictions.length} predictions`);

    console.log('\n✓ Database seeded successfully!');
    console.log('\nTest Credentials:');
    console.log('- Email: john@example.com');
    console.log('- Password: Password123');
    console.log('\n- Email: admin@example.com');
    console.log('- Password: AdminPass123');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedDatabase();
