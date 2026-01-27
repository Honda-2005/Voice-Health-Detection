import express from 'express';
import { authMiddleware as authenticateJWT } from '../middleware/authMiddleware.js';
import {
    exportPredictionPDF,
    exportEvaluationPDF,
    exportAllPredictionsPDF
} from '../controllers/pdfController.js';

const router = express.Router();

/**
 * @route   GET /api/v1/pdf/prediction/:id
 * @desc    Export single prediction as PDF
 * @access  Private
 */
router.get('/prediction/:id', authenticateJWT, exportPredictionPDF);

/**
 * @route   GET /api/v1/pdf/evaluation/:id
 * @desc    Export evaluation report as PDF
 * @access  Private
 */
router.get('/evaluation/:id', authenticateJWT, exportEvaluationPDF);

/**
 * @route   GET /api/v1/pdf/predictions
 * @desc    Export all user predictions as combined PDF
 * @access  Private
 * @query   startDate, endDate (optional)
 */
router.get('/predictions', authenticateJWT, exportAllPredictionsPDF);

export default router;
