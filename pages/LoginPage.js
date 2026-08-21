'use strict';

/**
 * LoginPage.js — Login Page Object
 *
 * Handles all interactions with the login page of the application.
 * Extends BasePage so it inherits all common actions (click, fill, etc.)
 *
 * SELECTORS:
 *   These are the CSS selectors for elements on the login page.
 *   If the app's HTML changes, update the selectors here — nowhere else.
 *
 * METHODS:
 *   open()                    → navigates to the login page and waits for it to load
 *   login(username, password) → fills in credentials and clicks the login button
 *   clickLogin()              → just clicks the login button (used for empty credential tests)
 *   getErrorMessage()         → reads and returns the error message shown after failed login
 */

const BasePage = require('./BasePage');
const ENV = require('../config/env');

// All CSS selectors for the login page — update here if the app HTML changes
const SELECTORS = {
  username:   '#UserName',                      // username input field
  password:   '#Password',                      // password input field
  loginBtn:   '#login-disable',                 // the login submit button
  errorMsg:   '.validation-summary-errors li',  // error message shown after failed login
  fieldError: '.field-validation-error span'    // inline field-level validation error
};

class LoginPage extends BasePage {
  constructor(page) {
    super(page);
    this.url = ENV.baseUrl; // login page is at the base URL
  }

  /**
   * Opens the login page and waits for it to fully load.
   * Uses networkidle to ensure all page resources are loaded before proceeding.
   */
  async open() {
    await this.navigate(this.url);
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fills in the username and password fields, then clicks login.
   * If username or password is empty/null, that field is skipped
   * (used for testing empty credential scenarios).
   *
   * @param {string} username - the username to enter
   * @param {string} password - the password to enter
   */
  async login(username, password) {
    if (username) await this.fill(SELECTORS.username, username);
    if (password) await this.fill(SELECTORS.password, password);
    await this.clickLogin();
  }

  /**
   * Clicks the login button.
   * Waits for the button to be visible before clicking.
   */
  async clickLogin() {
    await this.page.locator(SELECTORS.loginBtn).waitFor({ state: 'visible', timeout: ENV.timeouts.element });
    await this.click(SELECTORS.loginBtn);
  }

  /**
   * Reads the error message displayed after a failed login attempt.
   * Handles both summary errors and inline field validation errors.
   *
   * @returns {string} the error message text
   */
  async getErrorMessage() {
    const selector = `${SELECTORS.errorMsg}, ${SELECTORS.fieldError}`;
    await this.waitForSelector(selector, 8000);
    const errors = await this.page.locator(selector).allInnerTexts();
    return errors.join(' ');
  }
}

module.exports = LoginPage;
