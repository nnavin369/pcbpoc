'use strict';

/**
 * loginSteps.js — Step Definitions for Login Feature
 *
 * This file connects the Gherkin steps in login.feature to actual
 * Playwright actions via the LoginPage page object.
 *
 * EACH STEP EXPLAINED:
 *   Given I am on the login page       → opens the browser and navigates to the login URL
 *   When I enter username and password → fills in the credential fields
 *   When I click the login button      → clicks the submit button
 *   Then I should be redirected        → verifies the URL changed to the dashboard
 *   Then I should see an error message → verifies the error text shown on failed login
 *
 * NOTE: 'this' refers to the CustomWorld instance (defined in support/world.js)
 *       which provides this.page and this.loginPage
 */

const { Given, When, Then } = require('@cucumber/cucumber');
const { expect } = require('@playwright/test');
const ENV = require('../config/env');

// Navigates to the login page before each login scenario
Given('I am on the login page', async function () {
  await this.loginPage.open();
});

// Fills valid credentials from .env file — credentials never appear in feature files
When('I login with valid credentials', async function () {
  await this.loginPage.fill('#UserName', ENV.credentials.valid.username);
  await this.loginPage.fill('#Password', ENV.credentials.valid.password);
  await this.loginPage.clickLogin();
});

// Fills invalid credentials from .env file — credentials never appear in feature files
When('I login with invalid credentials', async function () {
  await this.loginPage.fill('#UserName', ENV.credentials.invalid.username);
  await this.loginPage.fill('#Password', ENV.credentials.invalid.password);
});

// Fills in the username and password fields with the provided values
When('I enter username {string} and password {string}', async function (username, password) {
  await this.loginPage.fill('#UserName', username);
  await this.loginPage.fill('#Password', password);
});

// Clicks the login button — used for both valid login and empty credential tests
When('I click the login button', async function () {
  await this.loginPage.clickLogin();
});

// Verifies the user was redirected to the dashboard after successful login
Then('I should be redirected to the dashboard', async function () {
  await this.page.waitForURL('**/DataApi/Dashboard', { timeout: ENV.timeouts.login });
  expect(this.page.url()).toContain('/DataApi/Dashboard');
});

// Verifies the correct error message is shown after a failed login attempt
Then('I should see an error message {string}', async function (expectedMsg) {
  const actual = await this.loginPage.getErrorMessage();
  expect(actual).toContain(expectedMsg);
});
