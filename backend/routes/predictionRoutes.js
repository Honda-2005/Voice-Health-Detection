import express from 'express';
import {
  submitForAnalysis,
  getPredictions,
  getPredictionById,
  getPredictionStats,
  sharePrediction,
} from '../controllers/predictionController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/analyze', submitForAnalysis);
router.get('/', getPredictions);
router.get('/stats', getPredictionStats);
router.get('/:id', getPredictionById);
router.post('/:id/share', sharePrediction);

export default router;
