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
 * Launches the browser, creates the shared page, and logs in.
 * All @dashboard scenarios will reuse this logged-in session.
 *
 * Timeout is set to 180s because login can take 60-90 seconds on this app.
 */
BeforeAll({ timeout: 180000 }, async function () {
  const page = await SessionManager.getSharedPage();
  const loginPage = new LoginPage(page);
  await SessionManager.loginOnce(loginPage);
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
    this.page = null;             // Playwright page — assigned in init()
    this._isolatedContext = null; // only set for @login tests — closed in teardown()
  }

  /**
   * Called in the Before hook before each scenario.
   * Assigns the correct page based on the scenario's tags.
   *
   * @param {string[]} tags - array of tags on the current scenario (e.g. ['@login', '@smoke'])
   */
  async init(tags = []) {
    const isLoginTest = tags.some(t => t.includes('@login'));

    if (isLoginTest) {
      // Login tests need a fresh browser context — no pre-existing session
      const { page, context } = await SessionManager.newIsolatedPage();
      this.page = page;
      this._isolatedContext = context; // saved so we can close it in teardown()
    } else {
      // Dashboard and other tests reuse the shared logged-in session
      this.page = await SessionManager.getSharedPage();
    }

    // Wire up page objects so steps can use this.loginPage, this.dashboardPage, and this.loanDetailsPage
    this.loginPage = new LoginPage(this.page);
    this.dashboardPage = new DashboardPage(this.page);
    this.loanDetailsPage = new LoanDetailsPage(this.page);
  }

  /**
   * Called in the After hook after each scenario.
   * Only closes isolated contexts (login tests) — the shared session stays alive.
   */
  async teardown() {
    if (this._isolatedContext) {
      await this._isolatedContext.close();
      this._isolatedContext = null;
    }
  }
}

setWorldConstructor(CustomWorld);
