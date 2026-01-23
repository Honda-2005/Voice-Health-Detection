import express from 'express';
import multer from 'multer';
import {
  uploadRecording,
  getRecordings,
  getRecordingById,
  updateRecording,
  deleteRecording,
  getRecordingStats,
} from '../controllers/recordingController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { uploadLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
});

// All routes require authentication
router.use(authMiddleware);

router.post('/upload', uploadLimiter, upload.single('audio'), uploadRecording);
router.get('/', getRecordings);
router.get('/stats', getRecordingStats);
router.get('/:id', getRecordingById);
router.put('/:id', updateRecording);
router.delete('/:id', deleteRecording);

export default router;
