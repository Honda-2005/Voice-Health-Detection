import fs from 'fs';
import path from 'path';

// Create logs directory if it doesn't exist
const logsDir = 'logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

const logFile = path.join(logsDir, `server-${new Date().toISOString().split('T')[0]}.log`);

const writeLog = (message) => {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  fs.appendFileSync(logFile, logMessage);
  console.log(logMessage.trim());
};

export const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Log request
  const method = req.method;
  const url = req.originalUrl;
  writeLog(`→ ${method} ${url}`);

  // Log response when it's sent
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - startTime;
    const status = res.statusCode;
    const statusColor = status >= 400 ? '❌' : '✓';
    writeLog(`← ${statusColor} ${status} ${method} ${url} (${duration}ms)`);

    return originalSend.call(this, data);
  };

  next();
};
