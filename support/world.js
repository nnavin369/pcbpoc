'use strict';

/**
 * world.js — Cucumber World (Test Context)
 *
 * The "World" is the shared context object available as 'this' inside every
 * step definition, Before hook, and After hook.
 *
 * WHAT IT DOES:
 *   - Holds the Playwright page instance (this.page)
 *   - Holds page object instances (this.loginPage, this.dashboardPage)
 *   - Decides which browser session to use based on the scenario's tags
 *
 * SESSION STRATEGY (tag-based):
 *   @login scenarios    → get a FRESH isolated browser page per scenario
 *                         (needed so each login test starts with no session)
 *   @dashboard scenarios → get the SHARED logged-in page
 *                         (login happened once in BeforeAll — reused here)
 *
 * LIFECYCLE:
 *   BeforeAll → login once, establish shared session
 *   Before    → init() assigns the correct page to this.page
 *   After     → teardown() closes isolated contexts (login tests only)
 *   AfterAll  → close the browser entirely
 */

const { setWorldConstructor, World, setDefaultTimeout, BeforeAll, AfterAll } = require('@cucumber/cucumber');
const SessionManager = require('../utils/sessionManager');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const LoanDetailsPage = require('../pages/LoanDetailsPage');
const ENV = require('../config/env');

// Set the default timeout for all steps (overridden per-step if needed)
setDefaultTimeout(ENV.timeouts.default);

/**
 * BeforeAll — runs ONCE before any scenario starts.
 * Lightweight initialization. Browser instance is launched strictly on-demand.
 */
BeforeAll(async function () {
  // Browser is launched on-demand to prevent ghost/duplicate windows
});

/**
 * AfterAll — runs ONCE after all scenarios have finished.
 * Closes the browser and cleans up all session state.
 */
AfterAll(async function () {
  await SessionManager.closeBrowser();
});

/**
 * CustomWorld — the context object available as 'this' in every step.
 * Extends the default Cucumber World class.
 */
class CustomWorld extends World {
  constructor(options) {
    super(options);
    this.page = null; // Playwright page — assigned in init()
  }

  /**
   * Called in the Before hook before each scenario.
   * Reuses the single active browser window to prevent multiple windows opening.
   *
   * @param {string[]} tags - array of tags on the current scenario
   */
  async init(tags = []) {
    const isLoginTest = tags.some(t => t.includes('@login'));

    // Always use the same single browser window
    this.page = await SessionManager.getSharedPage();

    if (isLoginTest) {
      // Clear cookies so each login scenario starts with a clean, unauthenticated session in the same window
      await this.page.context().clearCookies();
    } else {
      // For search, loan tabs, and api tests: authenticate once on demand
      this.loginPage = new LoginPage(this.page);
      await SessionManager.loginOnce(this.loginPage);
    }

    // Wire up page objects
    this.loginPage       = new LoginPage(this.page);
    this.dashboardPage   = new DashboardPage(this.page);
    this.loanDetailsPage = new LoanDetailsPage(this.page);
  }

  /**
   * Called in the After hook after each scenario.
   */
  async teardown() {
    // Single page remains open between scenarios for speed and single-window continuity
  }
}

setWorldConstructor(CustomWorld);
