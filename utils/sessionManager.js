'use strict';

/**
 * sessionManager.js — Browser Session Manager (Parallel-Safe & Video-Enabled)
 *
 * Manages the lifecycle of Playwright browsers, browser contexts, and pages across
 * sequential and parallel Cucumber execution workers.
 *
 * ARCHITECTURAL DESIGN:
 *
 *   1. Parallel Worker Isolation:
 *      Cucumber sets `CUCUMBER_WORKER_ID` (e.g. 0, 1, 2) when running tests in parallel.
 *      `workerSessions` Map isolates browser instances per worker so tests in different threads
 *      never cross-contaminate state or session cookies.
 *
 *   2. Dual Session Models:
 *      - Shared Session (@dashboard, @loanTabs): Logs in once during `BeforeAll` and reuses
 *        the active authenticated browser page across all scenarios for massive execution speed.
 *      - Isolated Session (@login): Creates a fresh, unauthenticated browser context per scenario
 *        for negative and boundary login tests.
 *
 *   3. Automatic Video Recording:
 *      Initializes each browser context with `recordVideo: { dir: 'reports/videos/' }`.
 *
 *   4. Full-Screen Maximization:
 *      Launches Chromium with `--start-maximized` and `viewport: null` to occupy the full screen.
 */

const { chromium } = require('playwright');
const fs           = require('fs');
const path         = require('path');
const ENV          = require('../config/env');
const logger       = require('./logger');

/**
 * Storage map holding session objects keyed by Worker ID.
 * Key: Worker ID (string) -> Value: { browser, context, page, isLoggedIn }
 */
const workerSessions = new Map();

/**
 * Returns the current parallel worker ID or defaults to 'default' for sequential execution.
 *
 * @returns {string} Worker ID
 */
function getWorkerId() {
  return process.env.CUCUMBER_WORKER_ID || 'default';
}

/**
 * Retrieves the session container for the current worker, initializing an empty one if not present.
 *
 * @returns {{ browser: import('playwright').Browser, context: import('playwright').BrowserContext, page: import('playwright').Page, isLoggedIn: boolean }}
 */
function getWorkerSession() {
  const id = getWorkerId();
  if (!workerSessions.has(id)) {
    workerSessions.set(id, {
      browser:     null,
      context:     null,
      page:        null,
      isLoggedIn:  false
    });
  }
  return workerSessions.get(id);
}

// Ensure reports/videos and reports/screenshots directories exist on disk
if (!fs.existsSync(ENV.video.dir)) {
  fs.mkdirSync(ENV.video.dir, { recursive: true });
}
if (!fs.existsSync(ENV.screenshots.dir)) {
  fs.mkdirSync(ENV.screenshots.dir, { recursive: true });
}

const SessionManager = {

  /**
   * Launches a Chromium browser instance for the current worker.
   * If a browser instance already exists for this worker, reuses it.
   *
   * @returns {Promise<import('playwright').Browser>} Active Playwright browser instance
   */
  async launchBrowser() {
    const session = getWorkerSession();
    if (!session.browser) {
      logger.info(`[Worker ${getWorkerId()}] Launching browser...`);
      session.browser = await chromium.launch({
        headless: ENV.browser.headless,
        slowMo:   ENV.browser.slowMo,
        args:     ENV.browser.args
      });
      logger.info(`[Worker ${getWorkerId()}] Browser launched`);
    }
    return session.browser;
  },

  /**
   * Returns the shared authenticated page instance for the current worker.
   * Creates a new video-enabled browser context and page if not yet initialized.
   *
   * @returns {Promise<import('playwright').Page>} Active Playwright page instance
   */
  async getSharedPage() {
    const session = getWorkerSession();
    if (!session.page) {
      const browser = await this.launchBrowser();
      session.context = await browser.newContext({
        viewport:    ENV.browser.viewport,
        recordVideo: { dir: ENV.video.dir }
      });
      session.page    = await session.context.newPage();
      logger.info(`[Worker ${getWorkerId()}] Shared browser page created (maximized laptop view, video recording active)`);
    }
    return session.page;
  },

  /**
   * Performs authentication for the current worker once per test suite execution.
   * Subsequent calls reuse the established authenticated session.
   *
   * @param {import('../pages/LoginPage')} loginPage - Instance of LoginPage
   * @returns {Promise<void>}
   */
  async loginOnce(loginPage) {
    const session = getWorkerSession();
    if (!session.isLoggedIn) {
      logger.info(`[Worker ${getWorkerId()}] Performing login...`);
      await loginPage.open();
      await loginPage.login(ENV.credentials.valid.username, ENV.credentials.valid.password);
      await session.page.waitForURL('**/DataApi/Dashboard', { timeout: ENV.timeouts.login });
      session.isLoggedIn = true;
      logger.info(`[Worker ${getWorkerId()}] Login successful — session established`);
    } else {
      logger.info(`[Worker ${getWorkerId()}] Session already active — skipping login`);
    }
  },

  /**
   * Creates a fresh, isolated browser context and page for @login tests.
   * Isolated from the shared worker session to ensure clean, unauthenticated state.
   *
   * @returns {Promise<{ page: import('playwright').Page, context: import('playwright').BrowserContext }>}
   */
  async newIsolatedPage() {
    const browser = await this.launchBrowser();
    const ctx = await browser.newContext({
      viewport:    ENV.browser.viewport,
      recordVideo: { dir: ENV.video.dir }
    });
    const page = await ctx.newPage();
    logger.info(`[Worker ${getWorkerId()}] Isolated page created for login test (maximized laptop view, video recording active)`);
    return { page, context: ctx };
  },

  /**
   * Resets the shared context and page so that closing the page on failure flushes video recording
   * and prepares a clean session for subsequent scenarios.
   *
   * @returns {void}
   */
  resetSharedSession() {
    const session = getWorkerSession();
    if (session.context) {
      session.context.close().catch(() => {});
      session.context = null;
    }
    session.page = null;
    session.isLoggedIn = false;
  },

  /**
   * Closes the browser for the current worker and cleans up stored session references.
   * Called during AfterAll hook execution.
   *
   * @returns {Promise<void>}
   */
  async closeBrowser() {
    const session = getWorkerSession();
    if (session.browser) {
      await session.browser.close();
      logger.info(`[Worker ${getWorkerId()}] Browser closed`);
      workerSessions.set(getWorkerId(), {
        browser:    null,
        context:    null,
        page:       null,
        isLoggedIn: false
      });
    }
  }
};

module.exports = SessionManager;
