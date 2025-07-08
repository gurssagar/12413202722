/**
 * Frontend logging utility
 */

import { log } from '../shared/logging';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';
type PackageContext = 'component' | 'api' | 'auth' | 'router' | 'ui';

/**
 * Log frontend events with standardized format
 * @param level Log severity level
 * @param context Context/area of application
 * @param message Descriptive message
 * @param metadata Optional additional data
 */
export async function frontendLog(
  level: LogLevel,
  context: PackageContext,
  message: string,
  metadata?: Record<string, unknown>
) {
  try {
    const result = await log(
      'frontend',
      level,
      context,
      metadata ? `${message} - ${JSON.stringify(metadata)}` : message
    );
    return result;
  } catch (error) {
    console.error('Failed to send log:', error);
    // Fallback to console logging if remote logging fails
    const consoleMethod = level === 'fatal' ? 'error' : level;
    (console as any)[consoleMethod](`[${context}] ${message}`, metadata);
    return null;
  }
}

/**
 * Convenience methods for common log levels
 */
export const logger = {
  debug: (context: PackageContext, message: string, metadata?: Record<string, unknown>) =>
    frontendLog('debug', context, message, metadata),
  info: (context: PackageContext, message: string, metadata?: Record<string, unknown>) =>
    frontendLog('info', context, message, metadata),
  warn: (context: PackageContext, message: string, metadata?: Record<string, unknown>) =>
    frontendLog('warn', context, message, metadata),
  error: (context: PackageContext, message: string, metadata?: Record<string, unknown>) =>
    frontendLog('error', context, message, metadata),
  fatal: (context: PackageContext, message: string, metadata?: Record<string, unknown>) =>
    frontendLog('fatal', context, message, metadata),
};