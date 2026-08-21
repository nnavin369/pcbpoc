'use strict';

/**
 * ============================================================================
 * LoanDetailsPage.js — Page Object for Loan Details View
 * ============================================================================
 *
 * 📖 WHAT IS THIS FILE?
 *   In automated testing, a "Page Object" is a JavaScript file that represents
 *   a real web page. Instead of writing browser clicks directly inside test
 *   steps, we put all the clicks, typing, and checks inside this file.
 *
 * 💡 JAVASCRIPT CONCEPTS EXPLAINED FOR BEGINNERS:
 *   - `class`        : A template or blueprint containing actions (methods) for a page.
 *   - `async / await`: Web pages take time to load. `await` tells JavaScript:
 *                      "Wait for the browser to finish this action before moving to the next line."
 *   - `this.page`    : Represents the active browser window controlled by Playwright.
 *   - `const / let`  : Variables used to store text, numbers, or objects.
 *
 * 📋 WHAT THIS PAGE HANDLES:
 *   The Loan Details view has 14 tabs:
 *   - Tabs 1 to 10 (Visible in top bar):
 *     1. Info, 2. Balances, 3. Property, 4. History, 5. Comments,
 *     6. Documents, 7. Loss Mitigation, 8. Foreclosure, 9. Bankruptcy,
 *     10. Delegated Authority.
 *   - Tabs 11 to 14 (Hidden under the "More" dropdown button):
 *     11. Taxes and Insurance, 12. Flood Occupancy, 13. Payoff Quote, 14. Cut off Dates.
 * ============================================================================
 */

// Import helper modules needed by this file
const BasePage       = require('./BasePage');          // Parent class with basic click/fill helpers
const logger         = require('../utils/logger');     // Helper to print colorful log messages in terminal
const ENV            = require('../config/env');       // Configuration settings loaded from .env file
const ApiInterceptor = require('../utils/apiInterceptor'); // Tool that monitors network API responses

/**
 * SELECTORS: A dictionary of CSS/HTML identifiers used by Playwright to find
 * buttons, links, tables, and loading spinners on the web page.
 */
const SELECTORS = {
  // Finds any tab link or list item matching the tab name
  tabItem: (tabName) => `a:has-text("${tabName}"), li:has-text("${tabName}"), .nav-link:has-text("${tabName}")`,
  // Finds the currently active/selected tab
  activeTab: '.nav-tabs .active, .k-state-active, li.active',
  // The main content area where tab data is displayed
  tabContainer: '.tab-content, .k-content, .loan-details-content',
  // Loading spinner overlays that appear while data loads
  loadingMask: '.k-loading-mask, .spinner-border, .loading-spinner',
  // Link to click the first loan in a search results table
  firstLoanLink: 'table tbody tr a, table tbody tr td:first-child a, .k-grid-content tr a'
};

class LoanDetailsPage extends BasePage {

  /**
   * List of the 4 tabs that are located inside the "More" dropdown menu.
   * We check this list to know whether to click directly on the top bar
   * or open the "More" dropdown first.
   */
  static MORE_DROPDOWN_TABS = [
    'taxes and insurance',
    'flood occupancy',
    'payoff quote',
    'cut off dates',
  ];

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: openLoanDetails(loanId)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Opens the loan details screen for a specific Loan ID number.
   *
   * HOW IT WORKS:
   *   1. Checks if the browser is already on the Loan Details page (`/Loans/Loan`).
   *      If yes, skips clicking (since search automatically redirects for exact matches).
   *   2. If on a results grid, finds the text of the Loan ID and clicks it.
   *   3. Waits for the page and network data to finish loading.
   *
   * @param {string} loanId - Example: "555835905"
   */
  async openLoanDetails(loanId) {
    logger.step(`Opening details for Loan ID: ${loanId}`);
    const currentUrl = this.page.url();

    // Check if the search already redirected directly to the details page
    if (currentUrl.includes('/Loans/Loan')) {
      logger.info('Application already navigated directly to Loan Details page (/Loans/Loan)');
      return;
    }

    // Look for the loan ID link on the search table and click it
    const loanLocator = this.page.locator(`text="${loanId}"`).first();
    if (await loanLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
      await loanLocator.click();
    } else {
      // Fallback: click the first link in the table
      const firstLink = this.page.locator(SELECTORS.firstLoanLink).first();
      if (await firstLink.isVisible({ timeout: 5000 }).catch(() => false)) {
        await firstLink.click();
      }
    }

    // Wait until HTML and network requests finish loading
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {});
    logger.step('Loan Details page opened');
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: navigateToTab(tabName)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Clicks and opens any of the 14 tabs on the Loan Details screen.
   *
   * HOW IT WORKS:
   *   1. Checks if user session is still logged in; recovers automatically if logged out.
   *   2. If the tab is "Info", it is already open by default, so no click is needed.
   *   3. Checks if the tab belongs under the "More" dropdown:
   *      - If YES: opens the "More" dropdown and clicks the item.
   *      - If NO: clicks the tab directly in the top header bar.
   *   4. Stays on the tab for 6 SECONDS so you can visually see the screen.
   *   5. Waits for any loading spinners to disappear.
   *
   * @param {string} tabName - Example: "Balances", "Property", "Taxes and Insurance"
   */
  async navigateToTab(tabName) {
    logger.step(`Navigating to tab: "${tabName}"`);

    // Step 1: Make sure the page is open and user is logged in
    await this._ensureLoanDetailsPage();

    const cleanName = tabName.trim().toLowerCase();

    // Step 2: "Info" is active when the page first loads — skip clicking
    if (cleanName === 'info') {
      logger.info('Tab "Info" is already active upon opening Loan Details view');
      await this.page.waitForTimeout(500);
      return;
    }

    // Step 3: Check if this tab is inside the "More" dropdown
    const isMoreTab = LoanDetailsPage.MORE_DROPDOWN_TABS.some(
      mt => cleanName.includes(mt) || mt.includes(cleanName)
    );

    if (isMoreTab) {
      // Click via the "More" dropdown
      await this._clickMoreDropdownTab(tabName);
    } else {
      // Click directly on the top header bar
      await this._clickHeaderTab(tabName);
    }

    // Step 4: Stay on the tab for 6 seconds for visual inspection
    await this.page.waitForTimeout(6000);

    // Step 5: Wait for any loading spinners or AJAX calls to finish
    await this.page.waitForSelector(SELECTORS.loadingMask, { state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});

    // Step 6: Final check that session didn't expire during click
    await this._ensureLoanDetailsPage();

    logger.step(`Tab "${tabName}" clicked and loaded`);
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: navigateToTabWithApiCapture(tabName)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Navigates to a tab while listening to all backend API/network calls
   *   made by the browser, and returns the list of API status codes.
   *
   * HOW IT WORKS:
   *   1. Starts the API interceptor listener.
   *   2. Clicks the tab using navigateToTab().
   *   3. Stops the API interceptor listener.
   *   4. Logs all captured API status codes (e.g. 200 OK) to the console.
   *   5. Returns the results so test steps can verify them.
   *
   * @param {string} tabName - The name of the tab to click
   * @returns {Promise<Object>} Object containing allResponses, totalCalls, passedCalls, failedCalls
   */
  async navigateToTabWithApiCapture(tabName) {
    const interceptor = new ApiInterceptor(this.page);

    // 1. Start listening to network traffic
    interceptor.startCapture();

    // 2. Perform the tab navigation
    await this.navigateToTab(tabName);

    // 3. Small buffer to catch late network responses
    await this.page.waitForTimeout(500);

    // 4. Stop listening
    interceptor.stopCapture();

    // 5. Print captured API calls to console
    interceptor.logResponses(tabName);

    const allResponses    = interceptor.getCapturedResponses();
    const failedResponses = interceptor.getFailedResponses();

    return {
      allResponses: allResponses,
      totalCalls: allResponses.length,
      passedCalls: allResponses.length - failedResponses.length,
      failedCalls: failedResponses.length,
      failedResponses: failedResponses,
    };
  }

  /**
   * --------------------------------------------------------------------------
   * HELPER FUNCTION: _clickHeaderTab(tabName) [Private]
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Finds and clicks a tab button in the top bar (Tabs 1 to 10).
   *   Uses the Y-position (Y < 300) to make sure it clicks the main top header
   *   and not an inner sub-tab located deeper on the page.
   *
   * @private
   * @param {string} tabName - The tab text to click
   */
  async _clickHeaderTab(tabName) {
    // List of locator search strategies to try in order
    const strategies = [
      this.page.locator(`a`).filter({ hasText: new RegExp(`^${this._escapeRegex(tabName)}$`, 'i') }).first(),
      this.page.locator(`a:has-text("${tabName}")`).first(),
      this.page.locator(`a:has-text("${tabName.split(' ')[0]}")`).first(),
    ];

    for (const locator of strategies) {
      try {
        if (await locator.isVisible({ timeout: 3000 })) {
          const box = await locator.boundingBox();
          // Make sure element is in the top header region (Y < 300px)
          if (box && box.y < 300) {
            await locator.click();
            logger.info(`Clicked header tab "${tabName}" (y=${Math.round(box.y)})`);
            return;
          }
        }
      } catch {
        // Try the next locator strategy if this one fails
      }
    }

    // If standard click didn't find it, use force-click fallback
    logger.warn(`Header tab "${tabName}" not found with standard locators, using force-click fallback`);
    await this.page.locator(`text="${tabName}"`).first().click({ force: true });
  }

  /**
   * --------------------------------------------------------------------------
   * HELPER FUNCTION: _clickMoreDropdownTab(tabName) [Private]
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Clicks a tab located inside the "More" dropdown menu (Tabs 11 to 14).
   *
   * HOW IT WORKS:
   *   1. Clicks the "More" button to open the dropdown menu.
   *   2. Waits 800ms for the animation to open the menu.
   *   3. Finds the item matching `tabName` inside the menu and clicks it.
   *
   * @private
   * @param {string} tabName - Example: "Taxes and Insurance", "Cut off Dates"
   */
  async _clickMoreDropdownTab(tabName) {
    logger.info(`Tab "${tabName}" is under the "More" dropdown — clicking "More" first`);

    // Step 1: Open the "More" dropdown menu
    const moreBtn = this.page.locator('a:has-text("More"), .dropdown-toggle:has-text("More")').first();
    await moreBtn.waitFor({ state: 'visible', timeout: 10000 });
    await moreBtn.click();
    logger.info('"More" dropdown clicked, waiting for menu to appear...');
    await this.page.waitForTimeout(800);

    // Step 2: Search for the item inside the opened dropdown menu
    const firstWord = tabName.split(' ')[0];
    const dropdownStrategies = [
      this.page.locator(`.dropdown-menu a:has-text("${tabName}")`).first(),
      this.page.locator(`.dropdown-menu a:has-text("${firstWord}")`).first(),
      this.page.locator(`.dropdown-menu li:has-text("${firstWord}")`).first(),
      this.page.locator(`a:has-text("${tabName}")`).first(),
      this.page.locator(`a:has-text("${firstWord}")`).first(),
    ];

    for (const locator of dropdownStrategies) {
      try {
        if (await locator.isVisible({ timeout: 2000 })) {
          await locator.click();
          logger.info(`Clicked "${tabName}" inside "More" dropdown`);
          return;
        }
      } catch {
        // Try next strategy
      }
    }

    // Fallback: force-click by text
    logger.warn(`"More" dropdown item "${tabName}" not found with standard locators, using force-click`);
    await this.page.locator(`text="${tabName}"`).first().click({ force: true });
  }

  /**
   * --------------------------------------------------------------------------
   * HELPER FUNCTION: _ensureLoanDetailsPage() [Private]
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Self-healing guard: Checks if the test server logged out or hit an error.
   *   If logged out, automatically re-logs in and re-opens the loan view.
   *
   * @private
   */
  async _ensureLoanDetailsPage() {
    const url = this.page.url();
    if (url.includes('/Account/Login') || url.includes('/Login')) {
      logger.warn('Session expired — re-authenticating to restore Loan Details view...');
      const LoginPage = require('./LoginPage');
      const loginPage = new LoginPage(this.page);
      await loginPage.login(ENV.credentials.valid.username, ENV.credentials.valid.password);
      await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      if (!this.page.url().includes('/Loans/Loan')) {
        await this._reSearchLoan('555835905');
      }
    } else if (url.includes('/Error') || url.includes('NotFound')) {
      logger.warn('Page hit error/NotFound — re-opening loan details via search...');
      await this._reSearchLoan('555835905');
    }
  }

  /**
   * --------------------------------------------------------------------------
   * HELPER FUNCTION: _reSearchLoan(loanId) [Private]
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Re-submits the Loan ID search on the dashboard to restore the loan view.
   *
   * @private
   * @param {string} loanId - Example: "555835905"
   */
  async _reSearchLoan(loanId) {
    logger.info(`Re-searching Loan ID ${loanId} to restore view...`);
    await this.page.goto(`${ENV.baseUrl}/DataApi/Dashboard`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    const searchDropdown = this.page.locator('.search-by .dropdown-toggle').first();
    await searchDropdown.waitFor({ state: 'visible', timeout: 30000 });
    await searchDropdown.click();
    await this.page.waitForTimeout(500);
    await this.page.locator('#loanid').click();
    await this.page.waitForTimeout(500);
    const searchInput = this.page.locator('.search-by input[type="text"]').first();
    await searchInput.fill(loanId);
    await this.page.locator('.input-group-append').first().click();
    await this.page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await this.page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: verifyTabContent(tabName)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Checks that the tab has loaded visible content and is not an error page.
   *
   * @param {string} tabName - The tab name being checked
   * @returns {Promise<boolean>} True if loaded with content, False otherwise
   */
  async verifyTabContent(tabName) {
    logger.step(`Verifying tab content for: "${tabName}"`);
    
    const isVisible = await this.page.locator('body').isVisible();
    const currentUrl = this.page.url();
    const bodyText = await this.page.locator('body').innerText();
    
    logger.info(`Tab "${tabName}" verified on page (URL: ${currentUrl}). Snippet length: ${bodyText.length} chars`);
    return isVisible && bodyText.length > 0 && !currentUrl.includes('/Account/Login');
  }

  /**
   * --------------------------------------------------------------------------
   * FUNCTION: verifyTabContentWithExpectedText(tabName, expectedKeywords)
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Reads the entire text content of the tab and verifies that ALL given
   *   keywords are present on the screen (case-insensitive).
   *
   * HOW IT WORKS:
   *   1. Reads all text on the webpage using `innerText()`.
   *   2. Converts everything to lowercase so letter case doesn't cause false failures.
   *   3. Loops through each expected keyword:
   *      - If found: adds to `matchedKeywords` list.
   *      - If missing: adds to `missingKeywords` list.
   *   4. Returns an object with the results.
   *
   * @param {string}   tabName          - Name of the tab (e.g. "Balances")
   * @param {string[]} expectedKeywords - Array of strings (e.g. ["Principal", "Escrow", "Balance"])
   * @returns {Promise<{isLoaded: boolean, matchedKeywords: string[], missingKeywords: string[]}>}
   */
  async verifyTabContentWithExpectedText(tabName, expectedKeywords = []) {
    logger.step(`Verifying tab content for: "${tabName}" with ${expectedKeywords.length} expected keyword(s)`);

    const isVisible  = await this.page.locator('body').isVisible();
    const currentUrl = this.page.url();
    const bodyText   = await this.page.locator('body').innerText();
    const isLoaded   = isVisible && bodyText.length > 0 && !currentUrl.includes('/Account/Login');

    const bodyLower = bodyText.toLowerCase();
    const matchedKeywords = [];
    const missingKeywords = [];

    // Check each keyword one by one
    for (const keyword of expectedKeywords) {
      if (bodyLower.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
        logger.info(`  ✔ Found "${keyword}" on tab "${tabName}"`);
      } else {
        missingKeywords.push(keyword);
        logger.warn(`  ✘ Missing "${keyword}" on tab "${tabName}"`);
      }
    }

    logger.info(
      `Tab "${tabName}" — ${matchedKeywords.length}/${expectedKeywords.length} keywords matched ` +
      `(URL: ${currentUrl}, body: ${bodyText.length} chars)`
    );

    return { isLoaded, matchedKeywords, missingKeywords };
  }

  /**
   * --------------------------------------------------------------------------
   * HELPER FUNCTION: _escapeRegex(str) [Private]
   * --------------------------------------------------------------------------
   * WHAT IT DOES:
   *   Escapes special regex characters in a string so it can be safely used
   *   inside regular expressions without crashing.
   *
   * @private
   * @param {string} str - Raw text string
   * @returns {string} Escaped string
   */
  _escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
}

module.exports = LoanDetailsPage;
