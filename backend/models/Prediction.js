import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recording',
      required: true,
    },
    condition: {
      type: String,
      enum: ['healthy', 'parkinsons', 'other'],
      required: true,
    },
    severity: {
      type: String,
      enum: ['mild', 'moderate', 'severe', 'none'],
      default: 'none',
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    probability: {
      healthy: { type: Number, min: 0, max: 1 },
      parkinsons: { type: Number, min: 0, max: 1 },
      other: { type: Number, min: 0, max: 1 },
    },
    symptoms: [
      {
        name: String,
        score: Number,
        description: String,
      },
    ],
    recommendations: [String],
    modelMetadata: {
      version: String,
      algorithm: String,
      trainingDate: Date,
      accuracy: Number,
    },
    isReviewed: {
      type: Boolean,
      default: false,
    },
    doctorReview: {
      doctorId: mongoose.Schema.Types.ObjectId,
      notes: String,
      reviewedAt: Date,
    },
    sharedWith: [
      {
        userId: mongoose.Schema.Types.ObjectId,
        sharedAt: Date,
        permissions: [String],
      },
    ],
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { recordingId: 1 },
      { condition: 1 },
    ],
  }
);

const Prediction = mongoose.model('Prediction', predictionSchema);

export default Prediction;
