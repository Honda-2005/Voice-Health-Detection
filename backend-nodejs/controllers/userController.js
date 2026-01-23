import User from '../models/User.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message,
    });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, dateOfBirth, gender } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        fullName,
        phone,
        dateOfBirth,
        gender,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

export const updateMedicalInfo = async (req, res) => {
  try {
    const { height, weight, conditions, medications, allergies } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        'medicalInfo.height': height,
        'medicalInfo.weight': weight,
        'medicalInfo.conditions': conditions,
        'medicalInfo.medications': medications,
        'medicalInfo.allergies': allergies,
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Medical information updated',
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update medical information',
      error: error.message,
    });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { notificationsEnabled, privacyLevel, theme } = req.body;

    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        'settings.notificationsEnabled': notificationsEnabled,
        'settings.privacyLevel': privacyLevel,
        'settings.theme': theme,
      },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Settings updated',
      data: user.toJSON(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update settings',
      error: error.message,
    });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const Recording = (await import('../models/Recording.js')).default;
    const Prediction = (await import('../models/Prediction.js')).default;

    const recordingCount = await Recording.countDocuments({ userId: req.userId });
    const predictionCount = await Prediction.countDocuments({ userId: req.userId });
    
    const recentRecordings = await Recording.find({ userId: req.userId })
      .sort({ createdAt: -1 })
      .limit(5);

    const conditionDistribution = await Prediction.aggregate([
      { $match: { userId: req.userId } },
      { $group: { _id: '$condition', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        totalRecordings: recordingCount,
        totalPredictions: predictionCount,
        recentRecordings,
        conditionDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message,
    });
  }
};

export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.userId).select('+password');
    
    if (!(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    // Soft delete - deactivate account
    user.isActive = false;
    await user.save();

    // TODO: Also delete/archive user's data
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete account',
      error: error.message,
    });
  }
};
