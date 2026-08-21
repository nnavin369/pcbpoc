/**
 * cucumber.js — Cucumber Configuration File
 *
 * This file defines HOW Cucumber runs your tests.
 * It has TWO profiles:
 *
 *   default  → runs tests SEQUENTIALLY (one at a time) — good for debugging
 *   parallel → runs tests in PARALLEL (multiple at once) — faster execution
 *
 * HOW TO USE PROFILES:
 *   npm test                          → uses 'default' profile (sequential)
 *   npm run test:parallel             → uses 'parallel' profile (3 workers)
 *   npm run test:parallel:loansearch  → parallel loan search only
 *
 * WHAT IS A WORKER?
 *   A worker is like a separate runner that picks up scenarios and runs them.
 *   With 3 workers, 3 scenarios can run at the same time in 3 browser windows.
 *   Each worker has its own browser and its own logged-in session.
 *
 * PARALLEL NOTES:
 *   - Each worker logs in independently (login happens once per worker)
 *   - @login tests always get isolated pages (safe for parallel)
 *   - @dashboard tests each get their own browser context per worker
 *   - '--parallel 3' means 3 scenarios run simultaneously
 *     Increase this number for more parallelism (e.g. --parallel 5)
 *     but be careful — too many workers can slow down a slow app
 */

// Ordered feature files according to business flow:
// 1.) User Authentication (login.feature)
// 2.) Loan Search on Dashboard (loanSearch.feature)
// 3.) Loan Details Multi-Tab Verification (loanDetailsTabs.feature)
// 4.) Loan Search API Response Validation (loanSearchApiValidation.feature)
const orderedFeatureFiles = [
  'features/login.feature',
  'features/loanSearch.feature',
  'features/loanDetailsTabs.feature',
  'features/loanSearchApiValidation.feature'
];

// Common options shared between both profiles
const commonOptions = [
  ...orderedFeatureFiles,              // explicit execution order 1 -> 2 -> 3 -> 4
  '--require support/world.js',        // load browser session + page objects
  '--require support/hooks.js',        // load before/after hooks
  '--require steps/loginSteps.js',     // load login step definitions
  '--require steps/dashboardSteps.js', // load loan search step definitions
  '--require steps/loanDetailsSteps.js', // load multi-tab loan details step definitions
  '--require steps/apiValidationSteps.js', // load API validation step definitions
  '--format progress',                 // show progress dots in terminal
  '--format ./support/allureReporter.js', // generate allure report data
  '--publish-quiet'                    // suppress cucumber.io publish message
];

module.exports = {

  /**
   * DEFAULT profile — Sequential execution (one scenario at a time)
   * Use this for: debugging, first-time runs, investigating failures
   * Run with: npm test
   */
  default: [...commonOptions].join(' '),

  /**
   * PARALLEL profile — Runs 3 scenarios simultaneously
   * Use this for: faster full suite execution, CI/CD pipelines
   * Run with: npm run test:parallel
   *
   * '--parallel 3' → spawns 3 worker processes
   * Each worker gets its own browser and logged-in session
   */
  parallel: [...commonOptions, '--parallel 3'].join(' ')
};
