const origins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:5000').split(',');

export const corsConfig = {
  origin: (origin, callback) => {
    if (!origin || origins.includes(origin) || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
};
