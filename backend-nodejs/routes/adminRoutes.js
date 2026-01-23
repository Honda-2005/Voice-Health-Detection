import express from 'express';
import {
  getAllUsers,
  getUserById,
  updateUserRole,
  deactivateUser,
  getSystemAnalytics,
  getSystemHealth,
} from '../controllers/adminController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.put('/users/:userId/role', updateUserRole);
router.put('/users/:userId/deactivate', deactivateUser);
router.get('/analytics', getSystemAnalytics);
router.get('/health', getSystemHealth);

export default router;
