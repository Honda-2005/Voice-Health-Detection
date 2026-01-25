import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    audioFile: {
      // Stored using GridFS
      filename: String,
      contentType: { type: String, default: 'audio/wav' },
      fileId: mongoose.Schema.Types.ObjectId, // GridFS file ID
      size: Number,
      duration: Number, // in seconds
    },
    metadata: {
      sampleRate: Number,
      channels: Number,
      bitDepth: Number,
      format: String,
    },
    recordingDate: {
      type: Date,
      default: () => new Date(),
      index: true,
    },
    // Audio features extracted by ML service
    features: {
      mfcc: [Number], // Mel-frequency cepstral coefficients
      pitch: Number,
      energy: Number,
      zeroCrossingRate: Number,
      spectralCentroid: Number,
      spectralRolloff: Number,
      chromagram: [[Number]],
      tempogram: [[Number]],
    },
    prediction: {
      condition: String, // e.g., 'parkinsons', 'healthy'
      severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
      confidence: Number, // 0-1
      probability: {
        healthy: Number,
        parkinsons: Number,
      },
      label: String,
      modelVersion: String,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    processingError: String,
    notes: String,
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, createdAt: -1 },
      { status: 1 },
      { recordingDate: -1 },
    ],
  }
);

// Index for efficient queries
recordingSchema.index({ userId: 1, status: 1, createdAt: -1 });

const Recording = mongoose.model('Recording', recordingSchema);

export default Recording;
