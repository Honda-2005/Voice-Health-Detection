import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recording',
      },
    ],
    predictionIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Prediction',
      },
    ],
    analysisType: {
      type: String,
      enum: ['trend', 'comparison', 'daily', 'weekly', 'monthly'],
      default: 'trend',
    },
    metrics: {
      totalRecordings: Number,
      averageConfidence: Number,
      conditions: {
        healthy: Number,
        parkinsons: Number,
        other: Number,
      },
      severityDistribution: {
        mild: Number,
        moderate: Number,
        severe: Number,
        none: Number,
      },
    },
    trends: {
      severityTrend: String, // 'improving', 'worsening', 'stable'
      confidenceTrend: [Number],
      severityScores: [Number],
      dates: [Date],
    },
    recommendations: [
      {
        title: String,
        description: String,
        priority: { type: String, enum: ['low', 'medium', 'high'] },
        category: String,
      },
    ],
    generatedAt: {
      type: Date,
      default: () => new Date(),
    },
    reportFormat: {
      type: String,
      enum: ['summary', 'detailed', 'medical'],
      default: 'detailed',
    },
  },
  {
    timestamps: true,
    indexes: [
      { userId: 1, generatedAt: -1 },
      { analysisType: 1, userId: 1 },
    ],
  }
);

const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
