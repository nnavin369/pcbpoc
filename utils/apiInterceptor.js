'use strict';

/**
 * ============================================================================
 * apiInterceptor.js — Network Response Interceptor & API Payload Validator
 * ============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 *   When a user clicks a button or tab in a modern web app, the browser makes
 *   hidden background network requests (called API / XHR / Fetch calls) to get
 *   data from the backend server.
 *
 *   This helper acts like a "listener" that watches all those background calls,
 *   captures their HTTP status codes, headers, and response JSON payloads,
 *   and provides validation methods to assert on specific response fields.
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
 *   - `response.text() / json()`      : Reads the actual data payload returned by the server.
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
    this._responses = [];      // List where all captured network responses are stored
    this._listener = null;      // The active callback function
    this._isCapturing = false;    // Flag to indicate if we are currently listening
    this._pendingBodyReads = []; // Promises for async body reading
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: startCapture()
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Starts recording all background API calls made by the browser.
   *   Filters out static files (like images, fonts, CSS) and records
   *   the URL, status code, HTTP method, and response body payload.
   */
  startCapture() {
    this._responses = [];
    this._pendingBodyReads = [];
    this._isCapturing = true;

    // Define the listener callback function
    this._listener = (response) => {
      if (!this._isCapturing) return;

      const request = response.request();
      const resourceType = request.resourceType();

      // Only save dynamic API calls (XHR / Fetch) or document navigation — ignore images/CSS/fonts
      if (resourceType === 'xhr' || resourceType === 'fetch' || request.method() === 'POST') {
        const item = {
          url: response.url(),
          status: response.status(),
          method: request.method(),
          resourceType: resourceType,
          timestamp: new Date().toISOString(),
          body: null,
          json: null,
        };

        this._responses.push(item);

        // Asynchronously capture body content without blocking the main event loop
        const readPromise = response.text()
          .then((text) => {
            item.body = text;
            try {
              item.json = JSON.parse(text);
            } catch {
              // Body is HTML or plain text, not JSON
              item.json = null;
            }
          })
          .catch(() => {
            item.body = null;
            item.json = null;
          });

        this._pendingBodyReads.push(readPromise);
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
   *   Stops recording and removes the network listener.
   *   Awaits any pending async response body reading operations.
   */
  async stopCapture() {
    this._isCapturing = false;
    if (this._listener) {
      this.page.removeListener('response', this._listener);
      this._listener = null;
    }
    // Wait for any trailing response body reads to settle
    await Promise.allSettled(this._pendingBodyReads);
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
   * FUNCTION: findResponses(endpointPattern)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Finds all captured responses whose URL contains the specified pattern.
   *
   * @param {string} endpointPattern - URL substring (e.g. "/DataApi/Balances" or "Search")
   * @returns {Array} List of matching response objects
   */
  findResponses(endpointPattern) {
    const cleanPattern = endpointPattern.trim().toLowerCase();
    return this._responses.filter(r => r.url.toLowerCase().includes(cleanPattern));
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: getResponseJson(endpointPattern)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Returns the parsed JSON payload of the first response matching the endpoint pattern.
   *
   * @param {string} endpointPattern - URL substring
   * @returns {Object|null} Parsed JSON object or null if not found/not JSON
   */
  getResponseJson(endpointPattern) {
    const match = this.findResponses(endpointPattern)[0];
    return match ? match.json : null;
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: getResponseBody(endpointPattern)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Returns the raw text body of the first response matching the endpoint pattern.
   *
   * @param {string} endpointPattern - URL substring
   * @returns {string|null} Raw body string or null
   */
  getResponseBody(endpointPattern) {
    const match = this.findResponses(endpointPattern)[0];
    return match ? match.body : null;
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: checkSpecificEndpoint(endpointPattern)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Checks whether a specific target endpoint was called and returned HTTP 200 OK.
   *
   * @param {string} endpointPattern - Example: "/DataApi/Balances"
   * @returns {Object} { matched: boolean, count: number, all200: boolean, details: Array }
   */
  checkSpecificEndpoint(endpointPattern) {
    const matches = this.findResponses(endpointPattern);
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
