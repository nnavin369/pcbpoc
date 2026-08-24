'use strict';

/**
 * DashboardPage.js — Page Object Model for Dashboard & Loan Search
 *
 * Encapsulates locators and interaction flows for the Dashboard view and the
 * unified Loan Search dropdown component in the Insight application.
 *
 * SEARCH MECHANISM:
 *   1. Dropdown Activation: Clicks `.search-by .dropdown-toggle` to open the selection tray.
 *   2. Filter Type Selection: Selects radio button (Loan ID, Borrower Name, Street, City, State, Zip).
 *   3. Input Population: Types search term while the dropdown remains open.
 *   4. Submission: Clicks the search button and waits for DOM parsing, spinner dismissal, and network idle.
 *   5. Session Resilience: If the server challenges authentication on submit, auto re-authenticates
 *      and re-executes the search query automatically.
 */

const BasePage = require('./BasePage');
const logger   = require('../utils/logger');
const ENV      = require('../config/env');

/**
 * DOM Selectors for Dashboard & Loan Search
 */
const SELECTORS = {
  searchDropdown: '.search-by .dropdown-toggle',
  searchRadio:    (type) => `label:has(#${type})`,
  searchInput:    '.form-control.others',
  firstNameInput: 'input[placeholder="Enter First Name"]',
  lastNameInput:  'input[placeholder="Enter Last Name"]',
  searchBtn:      '.input-group-append',
  resultsGrid:    'table tbody tr',
  noResults:      '.k-grid-norecords',
  loadingSpinner: '.k-loading-mask'
};

class DashboardPage extends BasePage {

  /**
   * Navigates to the Dashboard page URL and ensures full readiness.
   * If already on the Dashboard page, reuses the active view to avoid unnecessary page reload.
   *
   * @returns {Promise<void>}
   */
  async navigateToDashboard() {
    logger.step('Navigating to dashboard');

    // Fast path: if the search bar is already visible and session is alive, reuse instantly
    const isAlreadyReady = await this.page.locator(SELECTORS.searchDropdown).first().isVisible().catch(() => false);
    const currentUrl = this.page.url();
    if (isAlreadyReady && !currentUrl.includes('/Login') && !currentUrl.includes('/Account')) {
      logger.info('Already on Dashboard — reusing active session');
      return;
    }

    // Navigate to dashboard if not already there
    if (!currentUrl.includes('/DataApi/Dashboard')) {
      await this.page.goto(`${ENV.baseUrl}/DataApi/Dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    // Auto-recover if redirected to login page due to server session expiry
    if (this.page.url().includes('/Account/Login') || this.page.url().includes('/Login')) {
      logger.warn('Session redirected to login page, re-authenticating...');
      const LoginPage = require('./LoginPage');
      const loginPage = new LoginPage(this.page);
      await loginPage.login(ENV.credentials.valid.username, ENV.credentials.valid.password);
      await this.page.waitForURL('**/DataApi/Dashboard', { timeout: ENV.timeouts.login }).catch(() => {});
    }

    await this.page.waitForSelector(SELECTORS.searchDropdown, { state: 'visible', timeout: 30000 }).catch(() => {});
    logger.step('Dashboard loaded');
  }

  /**
   * Fills a standard single-input search query (Loan ID, Street, City, State, Zipcode).
   * Opens the dropdown tray, selects the corresponding radio option, and enters the search value.
   *
   * @param {string} type  - Search radio button ID (e.g. 'loanid', 'street', 'city')
   * @param {string} value - The query string to enter
   * @returns {Promise<void>}
   */
  async fillSearch(type, value) {
    this._lastSearchType  = type;
    this._lastSearchValue = value;

    // Step 1: Open search dropdown menu
    const searchDropdown = this.page.locator(SELECTORS.searchDropdown).first();
    await searchDropdown.waitFor({ state: 'visible', timeout: 30000 });
    await searchDropdown.click();
    await this.page.waitForTimeout(500);

    // Step 2: Select the radio button for the requested filter type
    await this.page.locator(SELECTORS.searchRadio(type)).click({ force: true });
    await this.page.waitForTimeout(400);

    // Step 3: Populate the input field while the dropdown remains open
    logger.step(`Filling search input [${type}] with: "${value}"`);
    await this.page.locator(SELECTORS.searchInput).waitFor({ state: 'attached', timeout: 15000 });
    await this.page.locator(SELECTORS.searchInput).clear();
    await this.page.locator(SELECTORS.searchInput).fill(value);
    logger.step('Search input filled');
  }

  /**
   * Fills a Borrower Name search query containing separate First and Last Name input fields.
   *
   * @param {string} firstName - First name query
   * @param {string} [lastName] - Optional last name query
   * @returns {Promise<void>}
   */
  async fillNameSearch(firstName, lastName) {
    // Step 1: Open search dropdown
    await this.click(SELECTORS.searchDropdown);
    await this.page.waitForTimeout(400);

    // Step 2: Select 'Name' radio option
    await this.page.locator(SELECTORS.searchRadio('name')).click({ force: true });
    await this.page.waitForTimeout(400);

    // Step 3: Populate First Name input
    logger.step(`Filling first name: "${firstName}"`);
    await this.page.locator(SELECTORS.firstNameInput).waitFor({ state: 'attached', timeout: 15000 });
    await this.page.locator(SELECTORS.firstNameInput).fill(firstName);

    // Step 4: Populate Last Name input (if provided)
    if (lastName) {
      logger.step(`Filling last name: "${lastName}"`);
      await this.page.locator(SELECTORS.lastNameInput).fill(lastName);
    }
    logger.step('Name inputs filled');
  }

  /**
   * Submits the populated search form and waits for the search results view to fully load.
   *
   * @returns {Promise<void>}
   */
  async submitSearch() {
    logger.step('Clicking search button');
    await this.click(SELECTORS.searchBtn);
    await this._waitForPageFullyLoaded();
  }

  /**
   * Orchestrates the 4-phase search page load verification:
   *   1. DOM Content Loaded: HTML document parsed.
   *   2. Spinner Lifecycle: Loading spinner attached and subsequently hidden.
   *   3. Network Idle: Background AJAX calls completed.
   *   4. Session Health Guard: If redirected to login, re-authenticates and re-executes search query.
   *
   * @private
   * @returns {Promise<void>}
   */
  async _waitForPageFullyLoaded() {
    logger.step('Waiting for search results page to fully load...');

    await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });

    await this.page.waitForSelector(SELECTORS.loadingSpinner, { state: 'attached', timeout: 5000 }).catch(() => {});
    await this.page.waitForSelector(SELECTORS.loadingSpinner, { state: 'hidden',   timeout: 60000 }).catch(() => {});

    await this.page.waitForLoadState('networkidle', { timeout: 60000 });

    // Probe DOM to check row presence across table classes
    const probe = await this.page.evaluate(() => {
      const selectors = [
        '.k-grid-content tr[role="row"]',
        '.k-grid tbody tr',
        'table tbody tr',
        '[role="row"]',
        '.grid-results tr',
        '.search-results tr',
        '.k-master-row'
      ];
      return selectors.map(s => ({ selector: s, count: document.querySelectorAll(s).length }));
    });
    logger.step(`DOM selector probe: ${JSON.stringify(probe)}`);

    let currentUrl   = this.page.url();
    let currentTitle = await this.page.title();
    logger.step(`Current URL after search: ${currentUrl}`);
    logger.step(`Current page title: ${currentTitle}`);

    if (currentUrl.includes('/Account/Login') || currentUrl.includes('/Login')) {
      logger.warn('Search redirected to Login page. Re-authenticating...');
      const LoginPage = require('./LoginPage');
      const loginPage = new LoginPage(this.page);
      await loginPage.login(ENV.credentials.valid.username, ENV.credentials.valid.password);
      await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
      currentUrl   = this.page.url();
      currentTitle = await this.page.title();

      // If re-login landed on search page without results, re-submit the search
      if (!currentUrl.includes('/Loans/Loan') && this._lastSearchType && this._lastSearchValue) {
        logger.info(`Re-submitting search for ${this._lastSearchType} "${this._lastSearchValue}" after session recovery...`);
        await this.fillSearch(this._lastSearchType, this._lastSearchValue);
        await this.click(SELECTORS.searchBtn);
        await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });
        await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
        currentUrl = this.page.url();
      }
    }

    // Guard against application 500 error page
    if (currentTitle.includes('500') || currentUrl.includes('/Error')) {
      throw new Error(`Application returned a 500 error page after search — this is an app-side bug. URL: ${currentUrl}`);
    }

    logger.step('Search results page fully loaded');
  }

  /**
   * Confirms result rows are present in the table, or validates that navigation directed to /Loans/Loan.
   *
   * @param {number} [timeout=60000] - Max wait time in ms
   * @returns {Promise<void>}
   */
  async waitForResults(timeout = 60000) {
    logger.step('Verifying result rows are present...');
    const url = this.page.url();
    if (url.includes('/Loans/Loan')) {
      logger.info('Navigated directly to Loan Details page (/Loans/Loan)');
      return;
    }
    await this.page.waitForSelector(SELECTORS.resultsGrid, { state: 'attached', timeout });
  }

  /**
   * Returns the count of result rows currently rendered in the table grid.
   *
   * @returns {Promise<number>}
   */
  async getResultCount() {
    const url = this.page.url();
    if (url.includes('/Loans/Loan')) {
      return 1;
    }
    const count = await this.page.locator(SELECTORS.resultsGrid).count();
    logger.info(`Application returned ${count} result row(s)`);
    return count;
  }

  /**
   * Checks whether the specified text string is present anywhere on the rendered page body.
   *
   * @param {string} text - Search string to match
   * @returns {Promise<boolean>} True if found, false otherwise
   */
  async pageContainsText(text) {
    logger.step(`Verifying page contains: "${text}"`);
    await this.page.waitForSelector(SELECTORS.resultsGrid, { state: 'visible', timeout: 30000 });
    const bodyText = await this.page.locator('body').innerText();
    logger.step(`Page body snippet: ${bodyText.substring(0, 500)}`);
    return bodyText.toLowerCase().includes(text.toLowerCase());
  }

  /**
   * Returns the current label displayed on the search type dropdown trigger button.
   *
   * @returns {Promise<string>}
   */
  async getSearchDropdownText() {
    return this.getText(SELECTORS.searchDropdown);
  }
}

module.exports = DashboardPage;
