import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

export const generateTokens = (userId, role = 'user') => {
  const accessToken = jwt.sign(
    {
      userId,
      role,
      type: 'access',
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: '24h',
    }
  );

  const refreshToken = jwt.sign(
    {
      userId,
      type: 'refresh',
    },
    process.env.JWT_SECRET_KEY,
    {
      expiresIn: '7d',
    }
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_KEY);
};

export const generatePasswordResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const generateEmailVerificationToken = () => {
  return uuidv4();
};

export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
