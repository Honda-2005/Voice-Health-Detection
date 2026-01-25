import Recording from '../models/Recording.js';
import Prediction from '../models/Prediction.js';
import mongoose from 'mongoose';

export const uploadRecording = async (req, res) => {
  try {
    const { filename, duration } = req.body;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided',
      });
    }

    // Create recording document
    const recording = new Recording({
      userId: req.userId,
      audioFile: {
        filename: filename || req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        duration: parseInt(duration) || 0,
      },
      metadata: {
        sampleRate: 44100, // Default, can be extracted from file
        channels: 1,
        bitDepth: 16,
        format: 'wav',
      },
      status: 'pending',
    });

    // TODO: Store audio in GridFS
    // For now, store in memory/file system
    recording.audioFile.fileId = new mongoose.Types.ObjectId();

    await recording.save();

    // Queue for ML processing
    // TODO: Send to ML service queue

    res.status(201).json({
      success: true,
      message: 'Recording uploaded successfully',
      data: recording,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to upload recording',
      error: error.message,
    });
  }
};

export const getRecordings = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    const skip = (page - 1) * limit;
    const query = { userId: req.userId };

    if (status) {
      query.status = status;
    }

    const total = await Recording.countDocuments(query);
    const recordings = await Recording.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: recordings,
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
      message: 'Failed to fetch recordings',
      error: error.message,
    });
  }
};

export const getRecordingById = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findOne({
      _id: id,
      userId: req.userId,
    }).populate('features prediction');

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    res.json({
      success: true,
      data: recording,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recording',
      error: error.message,
    });
  }
};

export const updateRecording = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const recording = await Recording.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { notes },
      { new: true }
    );

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    res.json({
      success: true,
      message: 'Recording updated',
      data: recording,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update recording',
      error: error.message,
    });
  }
};

export const deleteRecording = async (req, res) => {
  try {
    const { id } = req.params;

    const recording = await Recording.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    // TODO: Delete audio file from GridFS

    res.json({
      success: true,
      message: 'Recording deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete recording',
      error: error.message,
    });
  }
};

export const getRecordingStats = async (req, res) => {
  try {
    const totalRecordings = await Recording.countDocuments({ userId: req.userId });
    const totalDuration = await Recording.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: null, totalDuration: { $sum: '$audioFile.duration' } } },
    ]);

    const statusDistribution = await Recording.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalRecordings,
        totalDuration: totalDuration[0]?.totalDuration || 0,
        statusDistribution,
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
