'use strict';

/**
 * logger.js — Structured Console Logger
 *
 * Provides consistent, timestamped log messages throughout the framework.
 * Every log line includes the time, a level icon, and the message.
 *
 * LOG LEVELS:
 *   logger.info('...')  → general information (green ✅)
 *   logger.warn('...')  → something unexpected but not a failure (yellow ⚠️)
 *   logger.error('...') → something went wrong (red ❌)
 *   logger.step('...')  → marks a test action/step being executed (blue 🔷)
 *
 * EXAMPLE OUTPUT:
 *   [2026-08-07 10:00:00] 🔷 STEP  | Clicking: #login-disable
 *   [2026-08-07 10:00:01] ✅ INFO  | Login successful — session established
 */

const LEVELS = {
  INFO:  '✅ INFO',
  WARN:  '⚠️  WARN',
  ERROR: '❌ ERROR',
  STEP:  '🔷 STEP'
};

// Returns current date and time as a readable string e.g. "2026-08-07 10:00:00"
const timestamp = () => new Date().toISOString().replace('T', ' ').substring(0, 19);

/**
 * Automatically masks sensitive passwords and tokens in any log message string.
 */
function maskSensitive(msg) {
  if (typeof msg !== 'string') return msg;

  let clean = msg;

  // Mask known passwords from environment variables if loaded
  try {
    const ENV = require('../config/env');
    if (ENV?.credentials?.valid?.password) {
      clean = clean.split(ENV.credentials.valid.password).join('********');
    }
    if (ENV?.credentials?.invalid?.password) {
      clean = clean.split(ENV.credentials.invalid.password).join('********');
    }
  } catch {
    // config/env not yet loaded during bootstrap
  }

  // Generic pattern masking for passwords in log strings (e.g. Filling "#Password" with "...")
  clean = clean.replace(/(?:password|pwd|secret|token)["']?\s*[:=]\s*["']?([^"' \s]+)["']?/gi, (match, val) => {
    return match.replace(val, '********');
  });
  clean = clean.replace(/(Filling\s+["'][^"']*(?:password|pwd)[^"']*["']\s+with\s+["'])([^"']+)(["'])/gi, '$1********$3');

  return clean;
}

const logger = {
  info:  (msg) => console.log(`[${timestamp()}] ${LEVELS.INFO}  | ${maskSensitive(msg)}`),
  warn:  (msg) => console.log(`[${timestamp()}] ${LEVELS.WARN}  | ${maskSensitive(msg)}`),
  error: (msg) => console.log(`[${timestamp()}] ${LEVELS.ERROR} | ${maskSensitive(msg)}`),
  step:  (msg) => console.log(`[${timestamp()}] ${LEVELS.STEP}  | ${maskSensitive(msg)}`)
};

module.exports = logger;
