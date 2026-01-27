import express from 'express';
import { authMiddleware as authenticateJWT } from '../middleware/authMiddleware.js';
import { streamFromGridFS } from '../utils/gridfs.js';
import Recording from '../models/Recording.js';

const router = express.Router();

/**
 * @route   GET /api/v1/recordings/:id/download
 * @desc    Download audio file from GridFS
 * @access  Private
 */
router.get('/:id/download', authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;

        // Find recording and verify ownership
        const recording = await Recording.findOne({
            _id: id,
            userId: req.userId
        });

        if (!recording) {
            return res.status(404).json({
                success: false,
                message: 'Recording not found'
            });
        }

        if (!recording.audioFile?.fileId) {
            return res.status(404).json({
                success: false,
                message: 'Audio file not found'
            });
        }

        // Stream file from GridFS
        streamFromGridFS(recording.audioFile.fileId, res);

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to download recording',
            error: error.message
        });
    }
});

export default router;
