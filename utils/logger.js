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

const logger = {
  info:  (msg) => console.log(`[${timestamp()}] ${LEVELS.INFO}  | ${msg}`),
  warn:  (msg) => console.log(`[${timestamp()}] ${LEVELS.WARN}  | ${msg}`),
  error: (msg) => console.log(`[${timestamp()}] ${LEVELS.ERROR} | ${msg}`),
  step:  (msg) => console.log(`[${timestamp()}] ${LEVELS.STEP}  | ${msg}`)
};

module.exports = logger;
