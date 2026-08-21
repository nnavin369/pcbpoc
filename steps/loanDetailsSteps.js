'use strict';

/**
 * ============================================================================
 * loanDetailsSteps.js — Cucumber BDD Step Definitions
 * ============================================================================
 *
 * 📖 WHAT IS A STEP DEFINITION FILE?
 *   Cucumber feature files are written in plain English (Given, When, Then).
 *   This file connects those plain English sentences to actual JavaScript code
 *   that drives the browser and performs checks.
 *
 * 💡 JAVASCRIPT & BDD CONCEPTS EXPLAINED FOR BEGINNERS:
 *   - `When('...', async function () {})`: Runs when Cucumber encounters a 'When' line.
 *   - `Then('...', async function () {})`: Runs when Cucumber encounters a 'Then' line.
 *   - `expect(actual).toBe(expected)`    : An assertion. If `actual` does not match
 *                                          `expected`, the test fails and shows an error.
 *   - `this.loanDetailsPage`             : The page object instance representing the web page.
 *   - `dataTable.hashes()`               : Converts the Gherkin table into a list of rows
 *                                          where each column header is a key.
 *
 * 📋 WHAT THIS STEP HANDLES:
 *   1. Semicolon `;` Delimiters: Splits keywords safely (e.g. "Loan; Borrower; Servicer").
 *   2. Dual Verification (UI + API): Checks keywords on screen AND verifies API returns 200.
 *   3. Continue-On-Failure (Soft Assertions): If Tab 5 fails, it does NOT crash or stop.
 *      It takes a screenshot of Tab 5, logs the error, and proceeds to Tabs 6 through 14.
 *   4. Color-Coded Table: Generates a Green (PASS) / Red (FAIL) HTML table in Allure report.
 * ============================================================================
 */

const { When, Then } = require('@cucumber/cucumber');
const { expect }       = require('@playwright/test');
const path             = require('path');
const logger           = require('../utils/logger');
const ENV              = require('../config/env');

/**
 * ----------------------------------------------------------------------------
 * STEP: When I click on loan ID {string} in search results
 * ----------------------------------------------------------------------------
 * PLAIN ENGLISH EXPLANATION:
 *   Finds the loan ID link on the search results screen and clicks it to open
 *   the Loan Details view.
 */
When('I click on loan ID {string} in search results', async function (loanId) {
  await this.loanDetailsPage.openLoanDetails(loanId);
});

/**
 * ----------------------------------------------------------------------------
 * STEP: Then I verify the following loan detail tabs in sequence:
 * ----------------------------------------------------------------------------
 * PLAIN ENGLISH EXPLANATION:
 *   Legacy simple step: clicks each tab in order and verifies basic loading.
 */
Then('I verify the following loan detail tabs in sequence:', async function (dataTable) {
  const tabs = dataTable.hashes().map(row => row['Tab Name']);
  
  for (const tabName of tabs) {
    await this.loanDetailsPage.navigateToTab(tabName);
    const isVerified = await this.loanDetailsPage.verifyTabContent(tabName);
    expect(isVerified, `Expected tab "${tabName}" to load content successfully`).toBe(true);
  }
});

/**
 * ----------------------------------------------------------------------------
 * STEP: Then I verify the following loan detail tabs and expected content:
 * ----------------------------------------------------------------------------
 * PLAIN ENGLISH EXPLANATION:
 *   Main verification engine for the 14-tab feature.
 *
 *   FOR EACH TAB ROW IN THE GHERKIN TABLE:
 *     1. Navigates to the tab and stays for 6 seconds.
 *     2. Captures all network API calls triggered during navigation.
 *     3. Checks if the expected business API endpoint was called with HTTP 200 OK.
 *     4. Reads the page text and checks that all expected UI keywords appear.
 *     5. If a tab fails: takes a screenshot for that tab, records the error,
 *        and CONTINUES to the next tab (does not stop early).
 *     6. At the end, builds a color-coded HTML summary table with Green/Red badges
 *        and attaches it directly to the Allure report.
 */
Then('I verify the following loan detail tabs and expected content:', { timeout: 300000 }, async function (dataTable) {
  // Read all rows from the Gherkin feature table
  const rows = dataTable.hashes();

  // Arrays to hold results and errors across all 14 tabs
  const allTabErrors = [];
  const tabResults   = [];

  // Loop through every tab row from 1 to 14
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const tabName          = row['Tab Name'];
    const expectedTextRaw  = row['Expected Text'] || '';
    const expectedEndpoint = row['Expected API Endpoint'] ? row['Expected API Endpoint'].trim() : '';

    // List of errors specific to this single tab
    const currentTabErrors = [];

    // Split the keywords by semicolon (e.g. "Loan; Borrower" -> ["Loan", "Borrower"])
    const expectedKeywords = expectedTextRaw
      .split(';')
      .map(kw => kw.trim())
      .filter(kw => kw.length > 0);

    try {
      // ----------------------------------------------------------------------
      // ACTION 1: Click the tab while recording backend network responses
      // ----------------------------------------------------------------------
      const apiResult = await this.loanDetailsPage.navigateToTabWithApiCapture(tabName);

      // ----------------------------------------------------------------------
      // CHECK 2: Verify the Specific Business API Endpoint returned 200 OK
      // ----------------------------------------------------------------------
      if (expectedEndpoint) {
        // Check if the expected URL appeared in the network calls or page URL
        const isEndpointMatched = apiResult.allResponses.some(r =>
          r.url.toLowerCase().includes(expectedEndpoint.toLowerCase())
        ) || this.page.url().toLowerCase().includes(expectedEndpoint.toLowerCase());

        if (!isEndpointMatched) {
          currentTabErrors.push(`[API] Expected endpoint "${expectedEndpoint}" was not invoked`);
        } else {
          // Check that all matching requests returned HTTP 200
          const matchingCalls = apiResult.allResponses.filter(r =>
            r.url.toLowerCase().includes(expectedEndpoint.toLowerCase())
          );
          for (const call of matchingCalls) {
            if (call.status !== 200) {
              currentTabErrors.push(`[API] Endpoint ${call.url} returned HTTP ${call.status}, expected 200`);
            }
          }
        }
      }

      // ----------------------------------------------------------------------
      // CHECK 3: Ensure no other business API call failed with a 4xx or 5xx error
      // ----------------------------------------------------------------------
      if (apiResult.failedCalls > 0) {
        const failedDetails = apiResult.failedResponses
          .map(r => `${r.method} ${r.status} → ${r.url}`)
          .join('\n          ');
        currentTabErrors.push(`[API] ${apiResult.failedCalls} failed API call(s):\n          ${failedDetails}`);
      }

      // ----------------------------------------------------------------------
      // CHECK 4: Verify all expected UI keywords appear on the screen
      // ----------------------------------------------------------------------
      const result = await this.loanDetailsPage.verifyTabContentWithExpectedText(tabName, expectedKeywords);

      if (!result.isLoaded) {
        currentTabErrors.push(`[UI] Tab content failed to load (or was redirected to Login)`);
      }

      // If any keyword is missing, add it to the error list
      for (const missingKw of result.missingKeywords) {
        currentTabErrors.push(`[UI] Missing expected text keyword: "${missingKw}"`);
      }

    } catch (err) {
      // If an unexpected crash happened during click, record it safely
      currentTabErrors.push(`[Exception] Tab navigation error: ${err.message}`);
    }

    // Determine pass/fail for this tab
    const passed = currentTabErrors.length === 0;

    // Save tab result data for the final HTML summary table
    tabResults.push({
      index: i + 1,
      tabName: tabName,
      expectedText: expectedTextRaw,
      expectedEndpoint: expectedEndpoint,
      passed: passed,
      errors: currentTabErrors
    });

    // ------------------------------------------------------------------------
    // SOFT ASSERTION HANDLER: If this tab failed, take a screenshot & CONTINUE
    // ------------------------------------------------------------------------
    if (!passed) {
      try {
        const sanitizedTab = tabName.replace(/[^a-zA-Z0-9_-]/g, '_');
        const timestamp    = new Date().toISOString().replace(/[:.]/g, '-');
        const filename     = `FAILED_TAB_${sanitizedTab}_${timestamp}.png`;
        const filePath     = path.join(ENV.screenshots.dir, filename);

        // Take a screenshot of the failed tab and attach to report
        if (this.page && !this.page.isClosed()) {
          const screenshot = await this.page.screenshot({ path: filePath, fullPage: true }).catch(() => null);
          if (screenshot) {
            await this.attach(screenshot, 'image/png');
          }
        }
      } catch (attErr) {
        logger.warn(`Could not attach failure screenshot for tab "${tabName}": ${attErr.message}`);
      }

      logger.warn(`❌ Tab "${tabName}" had ${currentTabErrors.length} failure(s) — continuing to next tab...`);
      allTabErrors.push(`Tab "${tabName}":\n  - ${currentTabErrors.join('\n  - ')}`);
    } else {
      logger.info(`✅ Tab "${tabName}" PASSED all UI and API checks`);
    }
  }

  // --------------------------------------------------------------------------
  // BUILD COLOR-CODED HTML SUMMARY TABLE FOR ALLURE REPORT
  // --------------------------------------------------------------------------
  const passedCount = tabResults.filter(t => t.passed).length;
  const failedCount = tabResults.filter(t => !t.passed).length;

  // Generate an HTML table row for each tab with Green/Red styling
  const htmlRows = tabResults.map(t => {
    // Green badge for PASS, Red badge for FAIL
    const statusBadge = t.passed
      ? `<span style="background-color:#28a745; color:#ffffff; padding:4px 10px; border-radius:4px; font-weight:bold; font-size:12px; display:inline-block;">✔ PASSED</span>`
      : `<span style="background-color:#dc3545; color:#ffffff; padding:4px 10px; border-radius:4px; font-weight:bold; font-size:12px; display:inline-block;">✘ FAILED</span>`;

    const rowBg = t.passed ? '#ffffff' : '#fff5f5';
    const errorList = t.errors.length > 0
      ? `<ul style="margin:0; padding-left:18px; color:#c82333; font-size:12px;">${t.errors.map(e => `<li>${e}</li>`).join('')}</ul>`
      : `<span style="color:#28a745; font-size:12px;">All UI & API verifications matched</span>`;

    return `
      <tr style="background-color:${rowBg}; border-bottom:1px solid #e9ecef;">
        <td style="padding:10px; text-align:center; font-weight:bold; border:1px solid #dee2e6;">${t.index}</td>
        <td style="padding:10px; font-weight:bold; color:#212529; border:1px solid #dee2e6;">${t.tabName}</td>
        <td style="padding:10px; color:#495057; font-size:12px; border:1px solid #dee2e6;"><code>${t.expectedText}</code></td>
        <td style="padding:10px; color:#495057; font-size:12px; border:1px solid #dee2e6;"><code>${t.expectedEndpoint}</code></td>
        <td style="padding:10px; text-align:center; border:1px solid #dee2e6;">${statusBadge}</td>
        <td style="padding:10px; border:1px solid #dee2e6;">${errorList}</td>
      </tr>
    `;
  }).join('');

  // Complete styled HTML card container
  const htmlSummaryTable = `
    <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin:15px 0;">
      <div style="display:flex; justify-content:space-between; align-items:center; background-color:#343a40; color:#ffffff; padding:12px 16px; border-radius:6px 6px 0 0;">
        <h3 style="margin:0; font-size:16px; font-weight:600;">📊 Loan Details Multi-Tab Verification Summary</h3>
        <div>
          <span style="background-color:#28a745; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px; margin-right:6px; font-weight:bold;">Passed: ${passedCount}</span>
          <span style="background-color:${failedCount > 0 ? '#dc3545' : '#6c757d'}; color:#fff; padding:4px 8px; border-radius:4px; font-size:12px; font-weight:bold;">Failed: ${failedCount}</span>
        </div>
      </div>
      <table style="width:100%; border-collapse:collapse; background-color:#ffffff; box-shadow:0 1px 3px rgba(0,0,0,0.1); border:1px solid #dee2e6; border-radius:0 0 6px 6px; overflow:hidden;">
        <thead>
          <tr style="background-color:#f1f3f5; color:#495057; text-align:left; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">
            <th style="padding:10px; text-align:center; border:1px solid #dee2e6; width:40px;">#</th>
            <th style="padding:10px; border:1px solid #dee2e6; width:160px;">Tab Name</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Expected UI Keywords</th>
            <th style="padding:10px; border:1px solid #dee2e6; width:180px;">Expected API Endpoint</th>
            <th style="padding:10px; text-align:center; border:1px solid #dee2e6; width:110px;">Status</th>
            <th style="padding:10px; border:1px solid #dee2e6;">Verification Details / Errors</th>
          </tr>
        </thead>
        <tbody>
          ${htmlRows}
        </tbody>
      </table>
    </div>
  `;

  // Attach the styled HTML table directly into the Allure report
  await this.attach(htmlSummaryTable, 'text/html');

  // --------------------------------------------------------------------------
  // BUILD TEXT SUMMARY TABLE FOR TERMINAL & STACK TRACE
  // --------------------------------------------------------------------------
  const textSummaryTable = tabResults.map(t => {
    const status = t.passed ? '[PASS]' : '[FAIL]';
    const err = t.errors.length > 0 ? ` | Errors: ${t.errors.join('; ')}` : '';
    return `${String(t.index).padStart(2, ' ')}. ${status.padEnd(7, ' ')} ${t.tabName.padEnd(22, ' ')} | UI: ${t.expectedText} | API: ${t.expectedEndpoint}${err}`;
  }).join('\n');

  // Print summary to terminal
  logger.info(`\n=== TAB VERIFICATION SUMMARY ===\n${textSummaryTable}\n================================`);

  // --------------------------------------------------------------------------
  // FINAL ASSERTION: If any tab accumulated errors, fail the test here
  // --------------------------------------------------------------------------
  if (allTabErrors.length > 0) {
    expect(
      allTabErrors.length,
      `Tab verification failed on ${allTabErrors.length} tab(s):\n\n${textSummaryTable}\n\nDetailed Errors:\n${allTabErrors.join('\n\n')}`
    ).toBe(0);
  }
});
