'use strict';

/**
 * ============================================================================
 * hooks.js — Cucumber Lifecycle Hooks
 * ============================================================================
 *
 * 📖 WHAT IS A HOOK?
 *   Hooks are special functions that run automatically at different stages
 *   of a test scenario:
 *
 *   1. `Before`   : Runs BEFORE each scenario starts.
 *                   Sets up the browser window, logs into the application,
 *                   and creates the page objects.
 *
 *   2. `AfterStep`: Runs AFTER every single test step.
 *                   If a step FAILS, it immediately takes a full-page screenshot,
 *                   saves it into `reports/screenshots/`, and attaches it to Allure.
 *
 *   3. `After`    : Runs AFTER the entire scenario finishes.
 *                   - If the test FAILED: attaches the `.webm` video recording to Allure.
 *                   - If the test PASSED: deletes the temporary video file to save disk space.
 *                   - Cleans up isolated browser sessions.
 * ============================================================================
 */

const { Before, After, AfterStep, Status } = require('@cucumber/cucumber');
const fs     = require('fs');
const path   = require('path');
const logger = require('../utils/logger');
const ENV    = require('../config/env');

/**
 * ----------------------------------------------------------------------------
 * HELPER: sanitizeFileName(name)
 * ----------------------------------------------------------------------------
 * Converts special characters, spaces, and punctuation into safe underscores
 * so that screenshot filenames don't crash the Windows filesystem.
 */
function sanitizeFileName(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 80);
}

/**
 * ----------------------------------------------------------------------------
 * HOOK: Before
 * ----------------------------------------------------------------------------
 * Runs BEFORE every scenario.
 * Initializes the browser context and page objects based on scenario tags.
 */
Before(async function (scenario) {
  // Get all tags attached to this scenario (e.g. ['@dashboard', '@loanTabs'])
  const tags = scenario.pickle.tags.map(t => t.name);
  logger.info(`▶ Starting: "${scenario.pickle.name}" [${tags.join(', ')}]`);

  // Initialize the browser page and page objects
  await this.init(tags);
});

/**
 * ----------------------------------------------------------------------------
 * HOOK: AfterStep
 * ----------------------------------------------------------------------------
 * Runs AFTER every individual step.
 * If the step failed, captures an instant full-page PNG screenshot.
 */
AfterStep(async function ({ result, pickleStep }) {
  if (result.status === Status.FAILED) {
    logger.warn('Step failed — capturing failure screenshot...');
    try {
      if (this.page && !this.page.isClosed()) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename  = `FAILED_${sanitizeFileName(pickleStep?.text || 'step')}_${timestamp}.png`;
        const filePath  = path.join(ENV.screenshots.dir, filename);

        // 1. Take full-page screenshot and save to disk
        const screenshot = await this.page.screenshot({
          path: filePath,
          fullPage: true
        });

        // 2. Attach screenshot directly into the Allure HTML report
        await this.attach(screenshot, 'image/png');
        logger.info(`Screenshot captured, saved to ${filePath}, and attached to Allure report`);
      } else {
        logger.warn('Screenshot skipped — page is not available or already closed');
      }
    } catch (err) {
      logger.warn(`Screenshot capture failed: ${err.message}`);
    }
  }
});

/**
 * ----------------------------------------------------------------------------
 * HOOK: After
 * ----------------------------------------------------------------------------
 * Runs AFTER every scenario finishes.
 * Handles failure video attachment and passing video cleanup.
 */
After(async function (scenario) {
  const status   = scenario.result?.status;
  const isFailed = status === Status.FAILED;
  logger.info(`■ Finished: "${scenario.pickle.name}" → ${status}`);

  try {
    // 1. Capture scenario-level screenshot on failure
    if (isFailed && this.page && !this.page.isClosed()) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename  = `FAILED_${sanitizeFileName(scenario.pickle.name)}_${timestamp}.png`;
      const filePath  = path.join(ENV.screenshots.dir, filename);

      const screenshot = await this.page.screenshot({ path: filePath, fullPage: true }).catch(() => null);
      if (screenshot) {
        await this.attach(screenshot, 'image/png');
      }
    }

    // 2. Video Capture: Retrieve video reference before closing page/context
    let video = null;
    if (this.page && !this.page.isClosed()) {
      video = this.page.video();
    }

    // 3. Session Teardown:
    // - For @login (isolated context): always close the isolated page & context.
    // - For @dashboard & shared sessions:
    //   * If FAILED: close the page to flush the failure video and reset shared session for auto-recovery.
    //   * If PASSED: KEEP the shared page and session OPEN! Do NOT close and do NOT logout.
    if (this._isolatedContext) {
      await this.teardown();
    } else if (isFailed) {
      if (this.page && !this.page.isClosed()) {
        await this.page.close().catch(() => {});
      }
      const SessionManager = require('../utils/sessionManager');
      SessionManager.resetSharedSession();
    }

    // 4. Video Handling: Attach video to Allure ONLY for failed scenarios
    if (isFailed && video) {
      const videoPath = await video.path().catch(() => null);
      if (videoPath && fs.existsSync(videoPath)) {
        const videoBuffer = fs.readFileSync(videoPath);
        await this.attach(videoBuffer, 'video/webm');
        logger.info(`🎬 Video recording attached to Allure report for FAILED scenario: ${videoPath}`);
      }
    }

    // 5. Clear observable pause between scenarios so viewer/demo audience can clearly see final state
    if (this.page && !this.page.isClosed()) {
      await this.page.waitForTimeout(ENV.scenarioDelay);
    }
  } catch (err) {
    logger.warn(`After hook warning: ${err.message}`);
    await this.teardown().catch(() => {});
  }
});

