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

// Common support/step requires (shared across all profiles)
const commonRequires = [
  '--require support/world.js',
  '--require support/hooks.js',
  '--require steps/loginSteps.js',
  '--require steps/dashboardSteps.js',
  '--require steps/loanDetailsSteps.js',
  '--require steps/apiValidationSteps.js',
  '--format progress',
  '--format ./support/allureReporter.js',
  '--publish-quiet'
];

module.exports = {

  /**
   * DEFAULT profile — Sequential execution of ALL 4 feature files in order
   * Run with: npm test
   */
  default: [
    'features/login.feature',
    'features/loanSearch.feature',
    'features/loanDetailsTabs.feature',
    'features/loanSearchApiValidation.feature',
    ...commonRequires
  ].join(' '),

  /**
   * LOANTABS profile — Runs ONLY the 14-tab loan details test
   * Run with: npm run test:loantabs
   */
  loantabs: [
    'features/loanDetailsTabs.feature',
    ...commonRequires
  ].join(' '),

  /**
   * API profile — Runs ONLY the API response validation test
   * Run with: npm run test:api
   */
  api: [
    'features/loanSearchApiValidation.feature',
    ...commonRequires
  ].join(' '),

  /**
   * SEARCH profile — Runs ONLY the loan search dashboard tests
   * Run with: npm run test:2:search
   */
  search: [
    'features/loanSearch.feature',
    ...commonRequires
  ].join(' '),

  /**
   * AUTH profile — Runs ONLY the login/auth tests
   * Run with: npm run test:1:auth
   */
  auth: [
    'features/login.feature',
    ...commonRequires
  ].join(' '),

  /**
   * PARALLEL profile — Runs all 4 features with 3 workers simultaneously
   * Run with: npm run test:parallel
   */
  parallel: [
    'features/login.feature',
    'features/loanSearch.feature',
    'features/loanDetailsTabs.feature',
    'features/loanSearchApiValidation.feature',
    ...commonRequires,
    '--parallel 3'
  ].join(' ')
};
