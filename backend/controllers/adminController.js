import User from '../models/User.js';
import Recording from '../models/Recording.js';
import Prediction from '../models/Prediction.js';
import mongoose from 'mongoose';

export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;

    const skip = (page - 1) * limit;
    const query = {};

    if (role) {
      query.role = role;
    }

    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
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
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message,
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['user', 'doctor', 'admin'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role',
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    res.json({
      success: true,
      message: 'User role updated',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

export const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    res.json({
      success: true,
      message: 'User deactivated',
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate user',
      error: error.message,
    });
  }
};

export const getSystemAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalRecordings = await Recording.countDocuments();
    const totalPredictions = await Prediction.countDocuments();

    const recordingsByStatus = await Recording.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const predictionsByCondition = await Prediction.aggregate([
      { $group: { _id: '$condition', count: { $sum: 1 } } },
    ]);

    const averageConfidence = await Prediction.aggregate([
      { $group: { _id: null, avgConfidence: { $avg: '$confidence' } } },
    ]);

    const userStats = await Recording.aggregate([
      { $group: { _id: '$userId', recordingCount: { $sum: 1 } } },
      { $sort: { recordingCount: -1 } },
      { $limit: 10 },
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        totalRecordings,
        totalPredictions,
        recordingsByStatus,
        predictionsByCondition,
        averageConfidence: averageConfidence[0]?.avgConfidence || 0,
        topUsers: userStats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics',
      error: error.message,
    });
  }
};

export const getSystemHealth = async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    const dbStats = await mongoose.connection.db.stats();

    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date(),
        mongodb: {
          status: mongoStatus,
          collections: dbStats.collections,
          dataSize: dbStats.dataSize,
        },
        uptime: process.uptime(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'System health check failed',
      error: error.message,
    });
  }
};
