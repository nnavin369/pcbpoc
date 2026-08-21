'use strict';

/**
 * env.js — Central Configuration File
 *
 * This is the SINGLE SOURCE OF TRUTH for all environment settings.
 * All values are loaded from the .env file using the dotenv package.
 *
 * WHY .env FILE?
 *   Credentials and sensitive values should NEVER be hardcoded in source code.
 *   The .env file lives only on your local machine and is excluded from Git.
 *   This means passwords are never accidentally pushed to the repository.
 *
 * HOW IT WORKS:
 *   1. dotenv reads the .env file from the project root
 *   2. It loads each line as a variable into process.env
 *   3. This file reads from process.env and exports a clean config object
 *   4. All other files import this config — they never touch process.env directly
 *
 * HOW TO USE:
 *   const ENV = require('../config/env');
 *   ENV.baseUrl                      → the application URL
 *   ENV.credentials.valid.username   → valid username from .env
 *   ENV.credentials.valid.password   → valid password from .env
 *   ENV.browser                      → browser launch settings
 *   ENV.timeouts                     → how long to wait for various actions
 *
 * SETUP FOR NEW TEAM MEMBERS:
 *   1. Copy .env.example to .env
 *   2. Fill in the real credentials in .env
 *   3. Never commit .env to Git
 */

// Load variables from .env file into process.env
require('dotenv').config();

const ENV = {
  // Application base URL — loaded from .env
  baseUrl: process.env.BASE_URL,

  credentials: {
    // Valid credentials — loaded from .env — used for login and dashboard tests
    valid: {
      username: process.env.VALID_USERNAME,
      password: process.env.VALID_PASSWORD
    },
    // Invalid credentials — loaded from .env — used for negative login tests
    invalid: {
      username: process.env.INVALID_USERNAME,
      password: process.env.INVALID_PASSWORD
    }
  },

  browser: {
    // Convert string 'true'/'false' from .env to actual boolean
    headless: process.env.BROWSER_HEADLESS === 'true',
    // Convert string to number
    slowMo:   parseInt(process.env.BROWSER_SLOW_MO) || 80,
    viewport: { width: 1366, height: 768 }, // 1:1 Laptop aspect ratio to eliminate black/grey letterboxing
    args: ['--no-sandbox', '--disable-gpu', '--window-size=1366,768']
  },

  video: {
    dir: 'reports/videos/',
    size: { width: 1366, height: 768 } // Matches viewport 1:1 so video is 100% full application with zero black bars
  },

  screenshots: {
    dir: 'reports/screenshots/'
  },

  timeouts: {
    default:    parseInt(process.env.TIMEOUT_DEFAULT)    || 120000,
    login:      parseInt(process.env.TIMEOUT_LOGIN)      || 120000,
    element:    parseInt(process.env.TIMEOUT_ELEMENT)    || 15000,
    navigation: parseInt(process.env.TIMEOUT_NAVIGATION) || 120000
  }
};

module.exports = ENV;
