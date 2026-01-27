import express from 'express';
import {
  getProfile,
  updateProfile,
  updateMedicalInfo,
  updateSettings,
  getUserStats,
  deleteAccount,
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  updateProfileValidator as profileUpdateValidation,
  updateMedicalInfoValidator as medicalInfoValidation,
  validate as validateRequest,
} from '../middleware/validators.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

router.get('/profile', getProfile);
router.put('/profile', profileUpdateValidation, validateRequest, updateProfile);
router.put('/medical-info', medicalInfoValidation, validateRequest, updateMedicalInfo);
router.put('/settings', updateSettings);
router.get('/stats', getUserStats);
router.delete('/account', deleteAccount);

export default router;
