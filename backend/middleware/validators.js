import { body, param, query, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Authentication validators
export const registerValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be 2-100 characters'),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Invalid phone number format'),
  validate
];

export const loginValidator = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validate
];

// User validators
export const updateProfileValidator = [
  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }),
  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/),
  body('dateOfBirth')
    .optional()
    .isISO8601(),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other', 'prefer-not-to-say']),
  validate
];

export const updateMedicalInfoValidator = [
  body('height')
    .optional()
    .isFloat({ min: 50, max: 300 })
    .withMessage('Height must be between 50-300 cm'),
  body('weight')
    .optional()
    .isFloat({ min: 20, max: 500 })
    .withMessage('Weight must be between 20-500 kg'),
  body('conditions')
    .optional()
    .isArray(),
  body('medications')
    .optional()
    .isArray(),
  body('allergies')
    .optional()
    .isArray(),
  validate
];

// Recording validators
export const uploadRecordingValidator = [
  body('filename')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .matches(/^[a-zA-Z0-9_\-\s.]+$/)
    .withMessage('Invalid filename'),
  body('duration')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Duration must be 1-300 seconds'),
  validate
];

export const recordingIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid recording ID'),
  validate
];

export const paginationValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be >= 1'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be 1-100'),
  validate
];

// Prediction validators
export const analyzePredictionValidator = [
  body('recordingId')
    .isMongoId()
    .withMessage('Invalid recording ID'),
  validate
];

export const predictionIdValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid prediction ID'),
  validate
];

// Evaluation validators
export const generateReportValidator = [
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid start date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid end date'),
  body('reportFormat')
    .optional()
    .isIn(['summary', 'detailed', 'medical'])
    .withMessage('Format must be: summary, detailed, or medical'),
  validate
];

// Admin validators
export const userIdValidator = [
  param('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  validate
];

export const updateRoleValidator = [
  body('role')
    .isIn(['user', 'doctor', 'admin'])
    .withMessage('Role must be: user, doctor, or admin'),
  validate
];

export default {
  validate,
  registerValidator,
  loginValidator,
  updateProfileValidator,
  updateMedicalInfoValidator,
  uploadRecordingValidator,
  recordingIdValidator,
  paginationValidator,
  analyzePredictionValidator,
  predictionIdValidator,
  generateReportValidator,
  userIdValidator,
  updateRoleValidator
};
