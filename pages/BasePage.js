'use strict';

/**
 * BasePage.js — Base Page Object (Parent Class)
 *
 * All page objects (LoginPage, DashboardPage, etc.) extend this class.
 * It provides common reusable actions like click, fill, getText, etc.
 * with built-in waits and logging already included.
 *
 * WHY THIS EXISTS:
 *   Instead of repeating wait logic in every page, we define it once here.
 *   Every method automatically waits for the element to be visible before acting.
 *
 * HOW TO USE:
 *   class MyPage extends BasePage {
 *     async doSomething() {
 *       await this.click('#myButton');   // waits for button, then clicks
 *       await this.fill('#input', 'hi'); // waits for input, then types
 *     }
 *   }
 */

const logger = require('../utils/logger');
const ENV = require('../config/env');

class BasePage {
  /**
   * @param {import('playwright').Page} page - the Playwright page instance
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Navigates the browser to the given URL.
   * Waits for the DOM to be ready before continuing.
   *
   * @param {string} url - full URL to navigate to
   */
  async navigate(url) {
    logger.step(`Navigating to: ${url}`);
    await this.page.goto(url, { waitUntil: 'domcontentloaded', timeout: ENV.timeouts.navigation });
  }

  /**
   * Clicks an element identified by the CSS selector.
   * Waits for the element to be visible before clicking.
   *
   * @param {string} selector - CSS selector of the element to click
   */
  async click(selector) {
    logger.step(`Clicking: ${selector}`);
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: ENV.timeouts.element });
    await this.page.locator(selector).click();
  }

  /**
   * Types a value into an input field.
   * Waits for the field to be visible before typing.
   *
   * @param {string} selector - CSS selector of the input field
   * @param {string} value    - text to type into the field
   */
  async fill(selector, value) {
    logger.step(`Filling "${selector}" with "${value}"`);
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: ENV.timeouts.element });
    await this.page.locator(selector).fill(value);
  }

  /**
   * Reads and returns the visible text of an element.
   * Waits for the element to be visible before reading.
   *
   * @param {string} selector - CSS selector of the element
   * @returns {string} the inner text of the element
   */
  async getText(selector) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout: ENV.timeouts.element });
    return this.page.locator(selector).innerText();
  }

  /**
   * Checks if an element is currently visible on the page.
   *
   * @param {string} selector - CSS selector of the element
   * @returns {boolean} true if visible, false otherwise
   */
  async isVisible(selector) {
    return this.page.locator(selector).isVisible();
  }

  /**
   * Waits for the page URL to match a pattern.
   * Useful after login or navigation to confirm the correct page loaded.
   *
   * @param {string|RegExp} pattern - URL pattern to match
   * @param {number} timeout - max wait time in ms (defaults to login timeout)
   */
  async waitForURL(pattern, timeout = ENV.timeouts.login) {
    await this.page.waitForURL(pattern, { timeout });
  }

  /**
   * Waits for an element to appear in the DOM.
   *
   * @param {string} selector - CSS selector to wait for
   * @param {number} timeout  - max wait time in ms
   */
  async waitForSelector(selector, timeout = ENV.timeouts.element) {
    await this.page.waitForSelector(selector, { timeout });
  }

  /**
   * Returns the title of the current page.
   *
   * @returns {string} page title
   */
  async getTitle() {
    return this.page.title();
  }
}

module.exports = BasePage;
