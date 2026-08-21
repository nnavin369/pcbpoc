'use strict';

/**
 * dashboardSteps.js — Step Definitions for Loan Search Feature
 *
 * This file connects the Gherkin steps in loanSearch.feature to actual
 * Playwright actions via the DashboardPage page object.
 *
 * STEP FLOW FOR EACH SEARCH SCENARIO:
 *   1. Given I am on the dashboard          → navigate to dashboard, wait for full load
 *   2. When I select search type and enter  → pick search type from dropdown, fill value, click search
 *      OR When I search by name             → special step for Name search (two input fields)
 *   3. Then the search dropdown should show → verify the dropdown label updated correctly
 *   4. And loan search results should be... → wait for grid rows, assert count > 0
 *   5. And the results page should contain  → verify the searched value appears on the page
 *
 * NOTE: 'this' refers to the CustomWorld instance (defined in support/world.js)
 *       which provides this.page and this.dashboardPage
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');

/**
 * Navigates to the dashboard before each scenario.
 * Always does a fresh navigation to ensure a clean state regardless of
 * where the previous scenario left the browser.
 */
Given('I am on the dashboard', async function () {
  await this.dashboardPage.navigateToDashboard();
});

/**
 * Selects a search type from the dropdown and enters a search value.
 * Used for all search types EXCEPT Name (which has two separate input fields).
 *
 * The typeMap converts the human-readable label from the feature file
 * to the actual radio button ID used in the app's HTML.
 *
 * Examples:
 *   When I select search type "Loan ID" and enter "1023279372"
 *   When I select search type "City" and enter "Charlotte"
 */
When('I select search type {string} and enter {string}', async function (type, value) {
  const typeMap = {
    'Loan ID': 'loanid',
    'Name':    'name',
    'Street':  'street',
    'City':    'city',
    'State':   'state',
    'Zipcode': 'zipcode'
  };
  const radioId = typeMap[type] || type.toLowerCase();
  // fillSearch opens dropdown, selects radio, fills input — all while dropdown is open
  await this.dashboardPage.fillSearch(radioId, value);
  await this.dashboardPage.submitSearch();
});

/**
 * Special step for Name search — handles two separate input fields.
 * Waits for the first name input to be visible before filling.
 * Last name is optional — if empty string is passed, it is skipped.
 *
 * Example:
 *   When I search by name "Allen" "Cook"
 *   When I search by name "Allen" ""   ← last name skipped
 */
When('I search by name {string} {string}', async function (firstName, lastName) {
  // Uses fillNameSearch which keeps the dropdown open while filling name inputs
  await this.dashboardPage.fillNameSearch(firstName, lastName);
  await this.dashboardPage.submitSearch();
});

/**
 * Verifies the search type dropdown shows the correct label after selection.
 * Confirms the UI updated to reflect the chosen search type.
 *
 * Example: Then the search dropdown should show "Loan ID"
 */
Then('the search dropdown should show {string}', async function (expectedLabel) {
  const text = await this.dashboardPage.getSearchDropdownText();
  expect(text).toContain(expectedLabel);
});

/**
 * Waits for the results grid to load and asserts at least one row is returned.
 * This confirms data was actually fetched from the application.
 */
Then('loan search results should be fetched and displayed', async function () {
  await this.dashboardPage.waitForResults();
  const count = await this.dashboardPage.getResultCount();
  expect(count, `Expected results from application but got 0 rows`).toBeGreaterThan(0);
});

/**
 * Verifies the searched value appears somewhere on the results page.
 * Case-insensitive — "allen" will match "Allen" or "ALLEN".
 *
 * Example: And the results page should contain "Allen"
 */
Then('the results page should contain {string}', async function (text) {
  const found = await this.dashboardPage.pageContainsText(text);
  expect(found, `Expected page to contain "${text}" but it was not found`).toBe(true);
});
