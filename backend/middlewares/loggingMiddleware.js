const { log } = require('../shared/logging');

/**
 * Logging middleware that tracks request duration and logs response details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object 
 * @param {Function} next - Express next middleware function
 */
function loggingMiddleware(req, res, next) {
  const start = Date.now();
  
  res.on('finish', async () => {
    try {
      const duration = Date.now() - start;
      await log(
        'backend',
        res.statusCode >= 500 ? 'error' :
        res.statusCode >= 400 ? 'warn' : 'info',
        req.path.split('/')[1] || 'root',
        `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
      );
    } catch (err) {
      console.error('Logging middleware error:', err);
    }
  });

  next();
}

module.exports = loggingMiddleware;