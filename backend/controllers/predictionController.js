import Prediction from '../models/Prediction.js';
import Recording from '../models/Recording.js';
import mongoose from 'mongoose';

export const submitForAnalysis = async (req, res) => {
  try {
    const { recordingId } = req.body;

    // Verify recording belongs to user
    const recording = await Recording.findOne({
      _id: recordingId,
      userId: req.userId,
    });

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    // Update recording status
    recording.status = 'processing';
    await recording.save();

    // Create prediction document
    const prediction = new Prediction({
      userId: req.userId,
      recordingId,
      confidence: 0,
      status: 'pending',
    });

    await prediction.save();

    // TODO: Send to ML service for processing

    res.status(201).json({
      success: true,
      message: 'Recording submitted for analysis',
      data: prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit for analysis',
      error: error.message,
    });
  }
};

export const getPredictions = async (req, res) => {
  try {
    const { page = 1, limit = 10, condition } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId: req.userId };

    if (condition) {
      query.condition = condition;
    }

    const total = await Prediction.countDocuments(query);
    const predictions = await Prediction.find(query)
      .populate('recordingId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: predictions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch predictions',
      error: error.message,
    });
  }
};

export const getPredictionById = async (req, res) => {
  try {
    const { id } = req.params;

    const prediction = await Prediction.findOne({
      _id: id,
      userId: req.userId,
    }).populate('recordingId');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    res.json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch prediction',
      error: error.message,
    });
  }
};

export const getPredictionStats = async (req, res) => {
  try {
    const totalPredictions = await Prediction.countDocuments({ userId: req.userId });

    const conditionDistribution = await Prediction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$condition', count: { $sum: 1 } } },
    ]);

    const severityDistribution = await Prediction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$severity', count: { $sum: 1 } } },
    ]);

    const averageConfidence = await Prediction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } },
    ]);

    res.json({
      success: true,
      data: {
        totalPredictions,
        conditionDistribution,
        severityDistribution,
        averageConfidence: averageConfidence[0]?.avgConfidence || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

export const sharePrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    const prediction = await Prediction.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $push: { sharedWith: { userId, sharedAt: new Date() } } },
      { new: true }
    );

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Prediction not found',
      });
    }

    res.json({
      success: true,
      message: 'Prediction shared successfully',
      data: prediction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to share prediction',
      error: error.message,
    });
  }
};
