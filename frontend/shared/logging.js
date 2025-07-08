/**
 * Centralized logging utility for both frontend and backend
 * @param {string} stack - "backend" or "frontend"
 * @param {string} level - "debug"|"info"|"warn"|"error"|"fatal" 
 * @param {string} package - Component context (e.g. "handler", "db", "controller")
 * @param {string} message - Descriptive log message
 * @returns {Promise<{logID: string, message: string}>}
 */
async function log(stack, level, package, message) {
  const validStacks = ['backend', 'frontend'];
  const validLevels = ['debug', 'info', 'warn', 'error', 'fatal'];

  if (!validStacks.includes(stack)) {
    throw new Error(`Invalid stack: ${stack}. Must be one of: ${validStacks.join(', ')}`);
  }

  if (!validLevels.includes(level)) {
    throw new Error(`Invalid level: ${level}. Must be one of: ${validLevels.join(', ')}`);
  }

  const logData = {
    stack,
    level,
    package,
    message,
    timestamp: new Date().toISOString()
  };

  try {
    const response = await fetch('http://20.244.56.144/evaluation-service/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logData)
    });

    if (!response.ok) {
      throw new Error(`Logging failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to send log:', error);
    throw error;
  }
}

module.exports = { log };