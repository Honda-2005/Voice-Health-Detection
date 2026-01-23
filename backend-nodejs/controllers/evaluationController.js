import Analysis from '../models/Analysis.js';
import Recording from '../models/Recording.js';
import Prediction from '../models/Prediction.js';
import mongoose from 'mongoose';

export const generateEvaluationReport = async (req, res) => {
  try {
    const { startDate, endDate, reportFormat = 'detailed' } = req.body;

    const query = { userId: req.userId };
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get all recordings and predictions in period
    const recordings = await Recording.find(query).lean();
    const predictions = await Prediction.find({
      userId: req.userId,
      ...(startDate || endDate ? {
        createdAt: {
          ...(startDate && { $gte: new Date(startDate) }),
          ...(endDate && { $lte: new Date(endDate) }),
        }
      } : {})
    }).lean();

    // Calculate metrics
    const metrics = {
      totalRecordings: recordings.length,
      totalDuration: recordings.reduce((sum, r) => sum + (r.audioFile?.duration || 0), 0),
      averageConfidence: predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0,
      conditions: {},
      severityDistribution: {
        mild: 0,
        moderate: 0,
        severe: 0,
        none: 0,
      },
    };

    // Count conditions
    predictions.forEach(p => {
      metrics.conditions[p.condition] = (metrics.conditions[p.condition] || 0) + 1;
      if (p.severity) {
        metrics.severityDistribution[p.severity]++;
      }
    });

    // Detect trends
    const sortedPredictions = predictions.sort((a, b) => 
      new Date(a.createdAt) - new Date(b.createdAt)
    );

    const trends = {
      severityScores: sortedPredictions.map(p => {
        const scoreMap = { mild: 1, moderate: 2, severe: 3, none: 0 };
        return scoreMap[p.severity] || 0;
      }),
      confidenceScores: sortedPredictions.map(p => p.confidence),
      dates: sortedPredictions.map(p => p.createdAt),
    };

    // Determine trend direction
    let severityTrend = 'stable';
    if (trends.severityScores.length > 1) {
      const recent = trends.severityScores.slice(-5);
      const avgRecent = recent.reduce((a, b) => a + b, 0) / recent.length;
      const avgOlder = trends.severityScores.slice(0, -5).reduce((a, b) => a + b, 0) / (trends.severityScores.length - 5 || 1);
      
      if (avgRecent > avgOlder * 1.1) {
        severityTrend = 'worsening';
      } else if (avgRecent < avgOlder * 0.9) {
        severityTrend = 'improving';
      }
    }

    // Generate recommendations
    const recommendations = generateRecommendations(metrics, severityTrend);

    // Create analysis document
    const analysis = new Analysis({
      userId: req.userId,
      recordingIds: recordings.map(r => r._id),
      predictionIds: predictions.map(p => p._id),
      analysisType: 'trend',
      metrics,
      trends: { ...trends, severityTrend },
      recommendations,
      reportFormat,
      generatedAt: new Date(),
    });

    await analysis.save();

    res.status(201).json({
      success: true,
      message: 'Evaluation report generated',
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

export const getEvaluationStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      default:
        startDate.setDate(now.getDate() - 7);
    }

    // Get predictions in period
    const predictions = await Prediction.find({
      userId: req.userId,
      createdAt: { $gte: startDate },
    }).lean();

    // Calculate statistics
    const stats = {
      totalAnalyses: predictions.length,
      averageConfidence: predictions.length > 0
        ? predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length
        : 0,
      mostCommonCondition: null,
      conditionCounts: {},
      severityCounts: {
        mild: 0,
        moderate: 0,
        severe: 0,
        none: 0,
      },
      dailyTrend: [],
    };

    // Count conditions and severities
    predictions.forEach(p => {
      stats.conditionCounts[p.condition] = (stats.conditionCounts[p.condition] || 0) + 1;
      if (p.severity) {
        stats.severityCounts[p.severity]++;
      }
    });

    // Find most common
    stats.mostCommonCondition = Object.entries(stats.conditionCounts)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Calculate daily trend
    const dailyData = {};
    predictions.forEach(p => {
      const date = new Date(p.createdAt).toISOString().split('T')[0];
      if (!dailyData[date]) {
        dailyData[date] = { count: 0, avgConfidence: 0, total: 0 };
      }
      dailyData[date].count++;
      dailyData[date].total += p.confidence;
    });

    stats.dailyTrend = Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      avgConfidence: data.total / data.count,
    }));

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message,
    });
  }
};

export const getTrendAnalysis = async (req, res) => {
  try {
    const predictions = await Prediction.find({
      userId: req.userId,
    }).sort({ createdAt: 1 }).lean();

    const trends = {
      conditionTrend: {},
      severityProgression: [],
      confidenceProgression: [],
      timeline: [],
    };

    predictions.forEach(p => {
      const month = new Date(p.createdAt).toISOString().slice(0, 7);
      
      if (!trends.conditionTrend[month]) {
        trends.conditionTrend[month] = {};
      }
      trends.conditionTrend[month][p.condition] = (trends.conditionTrend[month][p.condition] || 0) + 1;

      trends.severityProgression.push({
        date: p.createdAt,
        severity: p.severity,
        condition: p.condition,
      });

      trends.confidenceProgression.push({
        date: p.createdAt,
        confidence: p.confidence,
      });
    });

    res.json({
      success: true,
      data: trends,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend analysis',
      error: error.message,
    });
  }
};

function generateRecommendations(metrics, trend) {
  const recommendations = [];

  if (metrics.conditions.parkinsons && metrics.conditions.parkinsons > 0) {
    recommendations.push({
      title: 'Consult a Neurologist',
      description: 'Multiple analyses have detected potential Parkinsons symptoms',
      priority: 'high',
      category: 'medical',
    });
  }

  if (metrics.averageConfidence > 0.8) {
    recommendations.push({
      title: 'Continue Monitoring',
      description: 'High confidence in detected conditions - maintain regular check-ups',
      priority: 'high',
      category: 'monitoring',
    });
  }

  if (trend === 'worsening') {
    recommendations.push({
      title: 'Seek Medical Attention',
      description: 'Condition appears to be worsening - please contact healthcare provider',
      priority: 'high',
      category: 'urgent',
    });
  }

  if (trend === 'improving') {
    recommendations.push({
      title: 'Positive Progress',
      description: 'Your condition shows signs of improvement',
      priority: 'low',
      category: 'positive',
    });
  }

  return recommendations;
}
