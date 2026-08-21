'use strict';

/**
 * ============================================================================
 * apiInterceptor.js — Network Response Interceptor & Status Code Validator
 * ============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 *   When a user clicks a button or tab in a modern web app, the browser makes
 *   hidden background network requests (called API / XHR / Fetch calls) to get
 *   data from the backend server.
 *
 *   This helper acts like a "listener" that watches all those background calls
 *   and checks if the server answered with `200 OK` or if something crashed (500/401).
 *
 * 💡 JAVASCRIPT & NETWORK CONCEPTS EXPLAINED FOR BEGINNERS:
 *   - `page.on('response', callback)` : Tells Playwright to run a function every time
 *                                       a network reply comes back from the server.
 *   - `XHR / Fetch`                   : Types of requests used for loading dynamic data.
 *   - `Status 200`                    : HTTP Success ("Everything is OK").
 *   - `Status 401 / 403`              : Unauthorized / Forbidden (Session expired).
 *   - `Status 500`                    : Internal Server Error (Backend crashed).
 *   - `KeepAlive`                     : Automatic background heartbeat ping sent by ASP.NET.
 *                                       We ignore these so they don't cause false alarms.
 *
 * 📋 HOW TO USE THIS IN A TEST:
 *   1. const interceptor = new ApiInterceptor(this.page);
 *   2. interceptor.startCapture();
 *   3. // click a button on the screen...
 *   4. interceptor.stopCapture();
 *   5. const failed = interceptor.getFailedResponses(); // should be 0
 * ============================================================================
 */

const logger = require('./logger');

class ApiInterceptor {
  /**
   * Creates a new interceptor instance attached to a specific Playwright page.
   *
   * @param {import('playwright').Page} page - The browser page to listen to
   */
  constructor(page) {
    this.page = page;
    this._responses = [];   // List where all captured network responses are stored
    this._listener = null;   // The active callback function
    this._isCapturing = false; // Flag to indicate if we are currently listening
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: startCapture()
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Starts recording all background API calls made by the browser.
   *   Filters out static files (like images, fonts, CSS) and only keeps
   *   actual data API calls (`xhr` and `fetch`).
   */
  startCapture() {
    this._responses = [];
    this._isCapturing = true;

    // Define the listener callback function
    this._listener = (response) => {
      if (!this._isCapturing) return;

      const request = response.request();
      const resourceType = request.resourceType();

      // Only save dynamic API calls (XHR / Fetch) — ignore images/CSS/fonts
      if (resourceType === 'xhr' || resourceType === 'fetch') {
        this._responses.push({
          url: response.url(),
          status: response.status(),
          method: request.method(),
          resourceType: resourceType,
          timestamp: new Date().toISOString(),
        });
      }
    };

    // Attach listener to Playwright page
    this.page.on('response', this._listener);
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: stopCapture()
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Stops recording and removes the network listener to free up memory.
   */
  stopCapture() {
    this._isCapturing = false;
    if (this._listener) {
      this.page.removeListener('response', this._listener);
      this._listener = null;
    }
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: getCapturedResponses()
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Returns a copy of all the network calls that were captured.
   *
   * @returns {Array} List of network response objects
   */
  getCapturedResponses() {
    return [...this._responses];
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: getFailedResponses()
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Returns only the calls that failed (status < 200 or status >= 300).
   *   Filters out framework heartbeat pings (`KeepAlive`, `IsFormsAuthenticated`, `IsSsoAuthenticated`)
   *   so background session telemetry does not trigger false positive test failures.
   *
   * @returns {Array} List of failed business API calls
   */
  getFailedResponses() {
    return this._responses.filter(r => {
      const isFailed = r.status < 200 || r.status >= 300;
      if (!isFailed) return false;

      // Ignore background framework telemetry / heartbeat pings
      const isFrameworkPing = r.url.includes('IsFormsAuthenticated') ||
                              r.url.includes('IsSsoAuthenticated') ||
                              r.url.includes('KeepAlive');
      return !isFrameworkPing;
    });
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: checkSpecificEndpoint(endpointPattern)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Checks whether a specific target endpoint (e.g. `/DataApi/Balances`)
   *   was called and whether all calls to that endpoint returned HTTP 200 OK.
   *
   * @param {string} endpointPattern - Example: "/DataApi/Balances"
   * @returns {Object} { matched: boolean, count: number, all200: boolean, details: Array }
   */
  checkSpecificEndpoint(endpointPattern) {
    const cleanPattern = endpointPattern.trim().toLowerCase();
    const matches = this._responses.filter(r => r.url.toLowerCase().includes(cleanPattern));
    const all200 = matches.length > 0 && matches.every(r => r.status >= 200 && r.status < 300);

    return {
      matched: matches.length > 0,
      count: matches.length,
      all200: all200,
      details: matches
    };
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: getSummary()
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Returns a readable summary string (e.g. "3 API calls captured (3 passed, 0 failed)").
   *
   * @returns {string} Summary text
   */
  getSummary() {
    const total = this._responses.length;
    const passed = this._responses.filter(r => r.status >= 200 && r.status < 300).length;
    const failed = total - passed;
    return `${total} API calls captured (${passed} passed, ${failed} failed)`;
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: logResponses(label)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Prints all captured API calls with checkmarks (✔) or crossmarks (✘)
   *   to the terminal log.
   *
   * @param {string} label - Context label (e.g. "Balances")
   */
  logResponses(label) {
    if (this._responses.length === 0) {
      logger.info(`  📡 [${label}] No API calls captured`);
      return;
    }

    logger.info(`  📡 [${label}] ${this.getSummary()}`);
    for (const r of this._responses) {
      const icon = (r.status >= 200 && r.status < 300) ? '✔' : '✘';
      let urlPath = r.url;
      try {
        urlPath = new URL(r.url).pathname;
      } catch {
        // Fallback to full URL if parsing fails
      }
      logger.info(`     ${icon} ${r.method} ${r.status} → ${urlPath}`);
    }
  }
}

module.exports = ApiInterceptor;
