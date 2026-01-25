import Recording from '../models/Recording.js';
import Prediction from '../models/Prediction.js';
import mongoose from 'mongoose';
import { uploadToGridFS, deleteFromGridFS } from '../utils/gridfs.js';

export const uploadRecording = async (req, res) => {
  try {
    const { filename, duration } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided',
      });
    }

    // Upload audio file to GridFS
    const fileId = await uploadToGridFS(req.file.buffer, {
      filename: filename || req.file.originalname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      userId: req.userId,
    });

    // Create recording document
    const recording = new Recording({
      userId: req.userId,
      audioFile: {
        fileId: fileId,
        filename: filename || req.file.originalname,
        contentType: req.file.mimetype,
        size: req.file.size,
        duration: parseInt(duration) || 0,
      },
      metadata: {
        sampleRate: 44100, // Default, can be extracted from file
        channels: 1,
        bitDepth: 16,
        format: req.file.mimetype.split('/')[1] || 'wav',
      },
      status: 'pending',
    });

    await recording.save();

    // Note: ML processing is triggered explicitly via /api/v1/predictions/analyze
    // This allows users to confirm upload before starting analysis

    res.status(201).json({
      success: true,
      message: 'Recording uploaded and stored successfully',
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

    const recording = await Recording.findOne({
      _id: id,
      userId: req.userId,
    });

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Recording not found',
      });
    }

    //Delete audio file from GridFS
    if (recording.audioFile?.fileId) {
      try {
        await deleteFromGridFS(recording.audioFile.fileId);
      } catch (error) {
        console.error('Failed to delete audio file from GridFS:', error);
        // Continue with deletion even if GridFS delete fails
      }
    }

    // Delete recording document
    await Recording.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Recording and audio file deleted',
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
