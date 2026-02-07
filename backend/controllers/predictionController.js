import Prediction from '../models/Prediction.js';
import Recording from '../models/Recording.js';
import mongoose from 'mongoose';
import { analyzeAudio } from '../utils/mlClient.js';
import logger from '../utils/logger.js';

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

    // Check if audio file exists
    if (!recording.audioFile?.fileId) {
      return res.status(400).json({
        success: false,
        message: 'No audio file found for this recording',
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

    // Send immediate response
    res.status(201).json({
      success: true,
      message: 'Recording submitted for analysis',
      data: prediction,
    });

    // ========================================
    // ML SERVICE INTEGRATION - ASYNC PROCESSING
    // ========================================

    // Process ML analysis asynchronously
    (async () => {
      try {
        logger.info(`Starting ML analysis for recording ${recordingId}`);

        // Update status to processing
        prediction.status = 'processing';
        await prediction.save();

        // Emit WebSocket event if available
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${req.userId}`).emit('prediction:status', {
            predictionId: prediction._id,
            status: 'processing',
            message: 'Analyzing audio...'
          });
        }

        // Get audio file from GridFS
        // Note: The ML service needs a file path, so we'll need to download from GridFS to temp file
        const gridfs = req.app.get('gridfs');
        const gfs = req.app.get('gfs');

        if (!recording.audioFile?.fileId) {
          throw new Error('No audio file found in recording');
        }

        // Download file from GridFS to temp location
        const tempFilePath = `./temp/${recording.audioFile.fileId}.${recording.audioFile.contentType.split('/')[1] || 'wav'}`;
        const fs = await import('fs');
        const path = await import('path');

        // Ensure temp directory exists
        const tempDir = path.dirname(tempFilePath);
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }

        // Download from GridFS
        const downloadStream = gfs.openDownloadStream(recording.audioFile.fileId);
        const writeStream = fs.createWriteStream(tempFilePath);

        await new Promise((resolve, reject) => {
          downloadStream.pipe(writeStream);
          downloadStream.on('error', reject);
          writeStream.on('finish', resolve);
          writeStream.on('error', reject);
        });

        try {
          // Call ML service with temp file
          const mlResult = await analyzeAudio(tempFilePath);

          // Store extracted features in recording
          recording.features = mlResult.features;
          recording.status = 'completed';
          await recording.save();

          // Normalize condition value for database (lowercase)
          const normalizedCondition = mlResult.condition.toLowerCase();

          // Update prediction with ML results
          prediction.condition = normalizedCondition;
          prediction.severity = mlResult.severity?.toLowerCase() || 'none';
          prediction.confidence = mlResult.confidence || 0;
          prediction.probability = {
            healthy: mlResult.probability?.healthy || 0,
            parkinsons: mlResult.probability?.parkinson || 0,
            other: 0
          };
          prediction.symptoms = mlResult.symptoms || [];
          prediction.recommendations = mlResult.recommendations || [];
          prediction.modelMetadata = {
            version: '1.0.0',
            algorithm: 'RandomForest',
            trainingDate: new Date('2026-02-07'),
            accuracy: 0.9231
          };
          prediction.status = 'completed';
          prediction.completedAt = new Date();

          await prediction.save();

          logger.info(`ML analysis completed successfully for recording ${recordingId}`);

          // Emit completion event
          if (io) {
            io.to(`user:${req.userId}`).emit('prediction:complete', {
              predictionId: prediction._id,
              condition: prediction.condition,
              confidence: prediction.confidence,
              status: 'completed'
            });
          }

        } finally {
          // Clean up temp file
          if (fs.existsSync(tempFilePath)) {
            fs.unlinkSync(tempFilePath);
          }
        }

      } catch (error) {
        logger.error(`ML analysis failed for recording ${recordingId}:`, error);

        // Update status to failed
        prediction.status = 'failed';
        prediction.error = error.message;
        await prediction.save();

        recording.status = 'failed';
        await recording.save();

        // Emit failure event
        const io = req.app.get('io');
        if (io) {
          io.to(`user:${req.userId}`).emit('prediction:failed', {
            predictionId: prediction._id,
            error: error.message,
            status: 'failed'
          });
        }
      }
    })();

  } catch (error) {
    logger.error('Submit for analysis error:', error);
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
