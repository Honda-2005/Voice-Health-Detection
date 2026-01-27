import express from 'express';
import {
  generateEvaluationReport,
  getEvaluationStats,
  getTrendAnalysis,
} from '../controllers/evaluationController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.post('/report', generateEvaluationReport);
router.get('/stats', getEvaluationStats);
router.get('/trends', getTrendAnalysis);

export default router;
