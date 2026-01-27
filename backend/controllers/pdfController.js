import Prediction from '../models/Prediction.js';
import Recording from '../models/Recording.js';
import User from '../models/User.js';
import Analysis from '../models/Analysis.js';
import { generatePredictionPDF, generateEvaluationPDF } from '../utils/pdfService.js';

/**
 * Export single prediction as PDF
 */
export const exportPredictionPDF = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch prediction with full data
        const prediction = await Prediction.findOne({
            _id: id,
            userId: req.userId
        }).populate('recordingId');

        if (!prediction) {
            return res.status(404).json({
                success: false,
                message: 'Prediction not found'
            });
        }

        // Fetch user data
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get recording
        const recording = prediction.recordingId;

        // Generate PDF
        const pdfBuffer = await generatePredictionPDF(prediction, recording, user);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="prediction-${prediction._id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate PDF',
            error: error.message
        });
    }
};

/**
 * Export evaluation report as PDF
 */
export const exportEvaluationPDF = async (req, res) => {
    try {
        const { id } = req.params;

        // Fetch evaluation/analysis
        const evaluation = await Analysis.findOne({
            _id: id,
            userId: req.userId
        });

        if (!evaluation) {
            return res.status(404).json({
                success: false,
                message: 'Evaluation report not found'
            });
        }

        // Fetch user data
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Generate PDF
        const pdfBuffer = await generateEvaluationPDF(evaluation, user);

        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="evaluation-${evaluation._id}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);

        // Send PDF
        res.send(pdfBuffer);

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate evaluation PDF',
            error: error.message
        });
    }
};

/**
 * Export all user predictions as combined PDF
 */
export const exportAllPredictionsPDF = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;

        // Build query
        const query = { userId: req.userId };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Fetch all predictions
        const predictions = await Prediction.find(query)
            .populate('recordingId')
            .sort({ createdAt: -1 })
            .limit(50); // Limit to prevent huge PDFs

        if (predictions.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No predictions found'
            });
        }

        // Fetch user
        const user = await User.findById(req.userId);

        // For multiple predictions, create a summary report
        const PDFDocument = (await import('pdfkit')).default;
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];

        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
            const pdfBuffer = Buffer.concat(chunks);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="predictions-report.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.send(pdfBuffer);
        });

        // Generate report
        doc.fontSize(24)
            .fillColor('#667eea')
            .text('Voice Health Detection', { align: 'center' })
            .fontSize(14)
            .fillColor('#666')
            .text('Comprehensive Predictions Report', { align: 'center' })
            .moveDown(2);

        doc.fontSize(10)
            .fillColor('#000')
            .text(`Patient: ${user.fullName}`)
            .text(`Period: ${startDate || 'All time'} - ${endDate || 'Present'}`)
            .text(`Total Predictions: ${predictions.length}`)
            .text(`Generated: ${new Date().toLocaleDateString()}`)
            .moveDown();

        // Summary statistics
        const healthyCount = predictions.filter(p => p.condition === 'healthy').length;
        const parkinsonsCount = predictions.filter(p => p.condition === 'parkinsons').length;
        const avgConfidence = predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

        doc.fontSize(16)
            .fillColor('#667eea')
            .text('Summary Statistics')
            .moveDown(0.5);

        doc.fontSize(10)
            .fillColor('#000')
            .text(`Healthy Predictions: ${healthyCount}`)
            .text(`Parkinson's Predictions: ${parkinsonsCount}`)
            .text(`Average Confidence: ${(avgConfidence * 100).toFixed(1)}%`)
            .moveDown(2);

        // List predictions
        doc.fontSize(16)
            .fillColor('#667eea')
            .text('Prediction Details')
            .moveDown(0.5);

        predictions.forEach((pred, index) => {
            doc.fontSize(12)
                .fillColor('#2c3e50')
                .text(`${index + 1}. ${new Date(pred.createdAt).toLocaleDateString()}`)
                .fontSize(10)
                .fillColor('#000')
                .text(`   Condition: ${pred.condition}`)
                .text(`   Confidence: ${(pred.confidence * 100).toFixed(1)}%`)
                .text(`   Severity: ${pred.severity || 'N/A'}`)
                .moveDown(0.5);
        });

        // Footer
        doc.fontSize(8)
            .fillColor('#666')
            .text('─'.repeat(80), { align: 'center' })
            .text('For research and educational purposes only', { align: 'center' });

        doc.end();

    } catch (error) {
        console.error('PDF generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate comprehensive PDF',
            error: error.message
        });
    }
};

export default {
    exportPredictionPDF,
    exportEvaluationPDF,
    exportAllPredictionsPDF
};
