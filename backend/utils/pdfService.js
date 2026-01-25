import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate prediction report PDF
 */
export const generatePredictionPDF = async (prediction, recording, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            // Collect PDF chunks
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Header
            doc.fontSize(24)
                .fillColor('#667eea')
                .text('Voice Health Detection', { align: 'center' })
                .fontSize(14)
                .fillColor('#666')
                .text('Prediction Report', { align: 'center' })
                .moveDown();

            // Disclaimer
            doc.fontSize(8)
                .fillColor('#e74c3c')
                .text('⚠️ DISCLAIMER: This report is for research and educational purposes only. NOT a medical diagnosis.', {
                    align: 'center',
                    width: 500
                })
                .moveDown(2);

            // Report Info
            doc.fontSize(10)
                .fillColor('#000')
                .text(`Report Date: ${new Date().toLocaleDateString()}`)
                .text(`Report ID: ${prediction._id}`)
                .moveDown();

            // Patient Information
            doc.fontSize(16)
                .fillColor('#667eea')
                .text('Patient Information')
                .moveDown(0.5);

            doc.fontSize(10)
                .fillColor('#000')
                .text(`Name: ${user.fullName}`)
                .text(`Email: ${user.email}`)
                .text(`Date of Birth: ${user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'N/A'}`)
                .moveDown();

            // Recording Details
            doc.fontSize(16)
                .fillColor('#667eea')
                .text('Recording Details')
                .moveDown(0.5);

            doc.fontSize(10)
                .fillColor('#000')
                .text(`Recording Date: ${new Date(recording.createdAt).toLocaleDateString()}`)
                .text(`Duration: ${recording.audioFile.duration} seconds`)
                .text(`File Size: ${(recording.audioFile.size / 1024).toFixed(2)} KB`)
                .text(`Sample Rate: ${recording.metadata.sampleRate} Hz`)
                .moveDown();

            // Analysis Results
            doc.fontSize(16)
                .fillColor('#667eea')
                .text('Analysis Results')
                .moveDown(0.5);

            // Condition box
            const conditionColor = prediction.condition === 'healthy' ? '#27ae60' : '#e74c3c';
            doc.fontSize(12)
                .fillColor(conditionColor)
                .text(`Predicted Condition: ${prediction.condition.toUpperCase()}`)
                .fillColor('#000')
                .fontSize(10)
                .text(`Severity: ${prediction.severity || 'N/A'}`)
                .text(`Confidence: ${(prediction.confidence * 100).toFixed(1)}%`)
                .moveDown();

            // Probability Distribution
            if (prediction.probability) {
                doc.fontSize(14)
                    .fillColor('#667eea')
                    .text('Probability Distribution')
                    .moveDown(0.3);

                doc.fontSize(10)
                    .fillColor('#000');

                Object.entries(prediction.probability).forEach(([key, value]) => {
                    const percentage = (value * 100).toFixed(1);
                    doc.text(`${key}: ${percentage}%`);

                    // Draw progress bar
                    const barWidth = (value * 200);
                    const y = doc.y;
                    doc.rect(100, y - 8, 200, 10).stroke('#ddd');
                    doc.rect(100, y - 8, barWidth, 10).fill(conditionColor);
                    doc.moveDown(0.5);
                });
                doc.moveDown();
            }

            // Symptoms
            if (prediction.symptoms && prediction.symptoms.length > 0) {
                doc.fontSize(14)
                    .fillColor('#667eea')
                    .text('Detected Symptoms')
                    .moveDown(0.3);

                doc.fontSize(10)
                    .fillColor('#000');

                prediction.symptoms.forEach((symptom, index) => {
                    doc.text(`${index + 1}. ${symptom}`);
                });
                doc.moveDown();
            }

            // Recommendations
            if (prediction.recommendations && prediction.recommendations.length > 0) {
                doc.fontSize(14)
                    .fillColor('#667eea')
                    .text('Recommendations')
                    .moveDown(0.3);

                doc.fontSize(10)
                    .fillColor('#000');

                prediction.recommendations.forEach((rec, index) => {
                    doc.text(`${index + 1}. ${rec}`);
                });
                doc.moveDown();
            }

            // Footer
            doc.fontSize(8)
                .fillColor('#666')
                .text('─'.repeat(80), { align: 'center' })
                .text('Voice Health Detection System - Research & Educational Use Only', { align: 'center' })
                .text('This report does not constitute medical advice. Consult a qualified healthcare professional.', { align: 'center' });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

/**
 * Generate evaluation report PDF
 */
export const generateEvaluationPDF = async (evaluation, user) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const chunks = [];

            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);

            // Header
            doc.fontSize(24)
                .fillColor('#667eea')
                .text('Voice Health Detection', { align: 'center' })
                .fontSize(14)
                .fillColor('#666')
                .text('Evaluation Report', { align: 'center' })
                .moveDown(2);

            // Report Info
            doc.fontSize(10)
                .fillColor('#000')
                .text(`Patient: ${user.fullName}`)
                .text(`Report Generated: ${new Date().toLocaleDateString()}`)
                .text(`Analysis Period: ${new Date(evaluation.startDate).toLocaleDateString()} - ${new Date(evaluation.endDate).toLocaleDateString()}`)
                .moveDown();

            // Statistics
            doc.fontSize(16)
                .fillColor('#667eea')
                .text('Statistics Summary')
                .moveDown(0.5);

            if (evaluation.metrics) {
                doc.fontSize(10)
                    .fillColor('#000')
                    .text(`Total Recordings: ${evaluation.metrics.totalRecordings || 0}`)
                    .text(`Total Predictions: ${evaluation.metrics.totalPredictions || 0}`)
                    .text(`Average Confidence: ${((evaluation.metrics.avgConfidence || 0) * 100).toFixed(1)}%`)
                    .moveDown();
            }

            // Trends
            if (evaluation.trends) {
                doc.fontSize(16)
                    .fillColor('#667eea')
                    .text('Health Trends')
                    .moveDown(0.5);

                doc.fontSize(10)
                    .fillColor('#000')
                    .text(JSON.stringify(evaluation.trends, null, 2));
                doc.moveDown();
            }

            // Footer
            doc.fontSize(8)
                .fillColor('#666')
                .text('─'.repeat(80), { align: 'center' })
                .text('For research and educational purposes only', { align: 'center' });

            doc.end();

        } catch (error) {
            reject(error);
        }
    });
};

export default {
    generatePredictionPDF,
    generateEvaluationPDF
};
