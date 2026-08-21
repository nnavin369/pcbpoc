# Framework Architecture — Technical Reference Guide
### Playwright + Cucumber.js + Allure | Newrez / Shellpoint Mortgage Servicing — Insight Portal

---

## Table of Contents
1. [Technology Stack](#1-technology-stack)
2. [Project Structure](#2-project-structure)
3. [Big Picture — How Everything Connects](#3-big-picture--how-everything-connects)
4. [Execution Flow — Step by Step](#4-execution-flow--step-by-step)
5. [Module Deep Dives](#5-module-deep-dives)
6. [Session Strategy — Core Design Decision](#6-session-strategy--core-design-decision)
7. [Tag System](#7-tag-system)
8. [Test Scenarios](#8-test-scenarios)
9. [CI/CD Pipeline](#9-cicd-pipeline)
10. [Adding a New Feature — Checklist](#10-adding-a-new-feature--checklist)
11. [Data Flow Diagram](#11-data-flow-diagram)
12. [Key Takeaways](#12-key-takeaways)

---

## 1. Technology Stack

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | v18.x (LTS) | JavaScript runtime |
| **Playwright** | 1.40.0 | Browser automation engine |
| **Cucumber.js** | 7.3.2 | BDD test runner — reads `.feature` files |
| **@playwright/test** | 1.40.0 | Assertion library (`expect`) |
| **allure-cucumberjs** | 2.15.1 | Allure + Cucumber integration |
| **allure-commandline** | 2.27.0 | Allure HTML report generator |
| **dotenv** | 17.x | Loads credentials from `.env` file |
| **Java JDK** | 17 (LTS) | Required by Allure CLI |

---

## 2. Project Structure

```
Playwright_BDD_POC/
├── .github/
│   └── workflows/
│       └── ci.yml                ← GitHub Actions CI/CD pipeline
├── config/
│   └── env.js                    ← Single source of truth for all settings
├── features/
│   ├── login.feature             ← Login test scenarios (plain English)
│   └── loanSearch.feature        ← Loan search test scenarios (plain English)
├── pages/
│   ├── BasePage.js               ← Common browser actions (click, fill, getText)
│   ├── LoginPage.js              ← Login page interactions
│   └── DashboardPage.js          ← Dashboard search interactions
├── steps/
│   ├── loginSteps.js             ← Connects login.feature to LoginPage
│   └── dashboardSteps.js         ← Connects loanSearch.feature to DashboardPage
├── support/
│   ├── world.js                  ← Browser session setup + scenario context
│   ├── hooks.js                  ← Before/After hooks + screenshot on failure
│   └── allureReporter.js         ← Allure report integration
├── utils/
│   ├── logger.js                 ← Timestamped console logging
│   └── sessionManager.js         ← Login-once shared session management
├── Documentation/                ← All technical documentation
├── .env                          ← Real credentials (excluded from Git)
├── .env.example                  ← Template for new team members
├── .gitignore                    ← Excludes .env, node_modules, allure-results
├── cucumber.js                   ← Cucumber runner configuration
└── package.json                  ← Scripts and dependencies
```

---

## 3. Big Picture — How Everything Connects

```
┌─────────────────────────────────────────────────────────────────────┐
│                        npm test (entry point)                       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    cucumber.js  (runner config)                     │
│  • Tells Cucumber WHERE features are                                │
│  • Tells Cucumber WHICH step files to load                          │
│  • Tells Cucumber WHICH formatter (Allure) to use                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
               ┌───────────────┼───────────────┐
               ▼               ▼               ▼
        features/         support/          steps/
      *.feature files    world.js          *.steps.js
      (WHAT to test)     hooks.js          (HOW to test)
                         allureReporter.js
               │               │               │
               └───────────────┼───────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      pages/         │
                    │  BasePage.js        │
                    │  LoginPage.js       │
                    │  DashboardPage.js   │
                    └──────────┬──────────┘
                               │
                    ┌──────────┼──────────┐
                    ▼          ▼          ▼
               utils/      config/    Playwright
             logger.js     env.js     Browser API
           sessionManager.js
```

**The golden rule:** Features describe WHAT. Steps describe HOW. Pages describe WHERE (selectors) and encapsulate actions. Config/Utils are shared infrastructure.

---

## 4. Execution Flow — Step by Step

When you run `npm test`, here is the exact sequence of events:

```
Step 1 ── cucumber.js is read
           └─ Loads: features/**/*.feature
           └─ Requires: support/world.js → support/hooks.js → steps/*.js
           └─ Formats output via: support/allureReporter.js

Step 2 ── world.js BeforeAll hook fires (ONCE before any scenario)
           └─ SessionManager.getSharedPage() → launches Chromium browser
           └─ SessionManager.loginOnce()     → navigates to app, logs in
           └─ Shared authenticated page is stored in memory

Step 3 ── For each Scenario:
           └─ hooks.js Before hook fires
               └─ Reads scenario tags (e.g. @login or @dashboard)
               └─ Calls this.init(tags) on the World object
                   ├─ @login tag?  → creates a FRESH isolated browser page
                   └─ other tags?  → reuses the SHARED logged-in page

Step 4 ── Cucumber matches each Gherkin step to a step definition
           └─ Step definitions call Page Object methods
           └─ Page Objects call BasePage methods
           └─ BasePage calls Playwright browser API
           └─ logger.js logs every action with timestamp

Step 5 ── hooks.js AfterStep fires after EVERY step
           └─ If step FAILED → captures full-page screenshot
           └─ Attaches screenshot to Allure report

Step 6 ── hooks.js After hook fires after each Scenario
           └─ Calls this.teardown() on the World object
               ├─ @login scenario? → closes the isolated browser context
               └─ @dashboard scenario? → does nothing (shared session stays alive)

Step 7 ── world.js AfterAll hook fires (ONCE after all scenarios)
           └─ SessionManager.closeBrowser() → closes the browser entirely

Step 8 ── Allure results written to allure-results/
           └─ Run: npm run report:generate → npm run report:open
```

---

## 5. Module Deep Dives

### 5.1 `config/env.js` — Single Source of Truth

All environment settings are loaded from the `.env` file via `dotenv`. No credentials or URLs are hardcoded anywhere in the codebase.

```
ENV
 ├── baseUrl                          → Application URL
 ├── credentials.valid.username       → Valid login username
 ├── credentials.valid.password       → Valid login password
 ├── credentials.invalid.username     → Invalid username (negative tests)
 ├── credentials.invalid.password     → Invalid password (negative tests)
 ├── browser.headless                 → true in CI, false locally
 ├── browser.slowMo                   → 0 in CI, 80ms locally (for debugging)
 └── timeouts.default/login/element   → All wait timeouts in one place
```

---

### 5.2 `features/*.feature` — Test Scenarios in Plain English

**`login.feature`** — 3 scenarios:
- `@smoke` — Successful login with valid credentials
- `@negative` — Login fails with invalid credentials
- `@negative` — Login fails with empty credentials

**`loanSearch.feature`** — 6 scenarios:
- `@loanid` — Search by Loan ID (`"0"`) → verifies results contain `"0"`
- `@name` — Search by Name (`"Allen"` `"Cook"`) → verifies results contain `"Allen"`
- `@street` — Search by Street (`"Main"`) → verifies results contain `"Main"`
- `@city` — Search by City (`"Charlotte"`) → verifies results contain `"Charlotte"`
- `@state` — Search by State (`"NC"`) → verifies results contain `"NC"`
- `@zipcode` — Search by Zipcode (`"666"`) → verifies results contain `"666"`

---

### 5.3 `pages/BasePage.js` — Reusable Browser Actions

Base class that wraps raw Playwright calls with built-in waiting, logging, and timeout handling. All page objects extend this.

```
BasePage
  ├── navigate(url)          → page.goto() with domcontentloaded wait
  ├── click(selector)        → waits for element visible, then clicks
  ├── fill(selector, value)  → waits for element visible, then types
  ├── getText(selector)      → waits for element visible, returns text
  ├── isVisible(selector)    → returns true/false
  └── waitForSelector(sel)   → waits for element to exist in DOM
```

---

### 5.4 `pages/LoginPage.js` — Login Page Object

```
LoginPage extends BasePage
  ├── SELECTORS
  │     username:  '#UserName'
  │     password:  '#Password'
  │     loginBtn:  '#login-disable'
  │     errorMsg:  '.validation-summary-errors li'
  │
  ├── open()              → navigates to baseUrl
  ├── login(user, pass)   → fills credentials + clicks login
  ├── clickLogin()        → clicks login button only
  └── getErrorMessage()   → returns error text from page
```

---

### 5.5 `pages/DashboardPage.js` — Dashboard Page Object

```
DashboardPage extends BasePage
  ├── SELECTORS
  │     searchDropdown:  '.search-by .dropdown-toggle'
  │     searchRadio:     (type) => `label:has(#${type})`
  │     searchInput:     '.form-control.others'
  │     firstNameInput:  'input[placeholder="Enter First Name"]'
  │     lastNameInput:   'input[placeholder="Enter Last Name"]'
  │     searchBtn:       '.input-group-append'
  │     resultsGrid:     'table tbody tr'
  │
  ├── navigateToDashboard()          → navigates to /DataApi/Dashboard
  ├── fillSearch(type, value)        → opens dropdown, selects radio, fills input
  ├── fillNameSearch(first, last)    → opens dropdown, fills first + last name
  ├── submitSearch()                 → clicks search button, waits for results page
  ├── waitForResults()               → waits for result rows to appear in grid
  ├── getResultCount()               → returns number of result rows
  ├── pageContainsText(text)         → verifies text exists on results page
  └── _waitForPageFullyLoaded()      → 4-step wait: DOM → spinner → networkidle → probe
```

---

### 5.6 `steps/*.js` — Glue Between Gherkin & Code

Step definitions are the bridge between `.feature` files and page objects. They must be thin — one line calling a page method, not complex browser logic.

**loginSteps.js** registered steps:
- `Given I am on the login page`
- `When I login with valid credentials`
- `When I login with invalid credentials`
- `When I click the login button`
- `Then I should be redirected to the dashboard`
- `Then I should see an error message {string}`

**dashboardSteps.js** registered steps:
- `Given I am on the dashboard`
- `When I select search type {string} and enter {string}`
- `When I search by name {string} {string}`
- `Then loan search results should be fetched and displayed`
- `Then the results page should contain {string}`

---

### 5.7 `utils/sessionManager.js` — Smart Browser Session

Module-level singleton — one instance for the entire test run.

```
SessionManager
  ├── launchBrowser()       → launches Chromium ONCE
  ├── getSharedPage()       → returns the shared logged-in page
  ├── loginOnce(loginPage)  → performs login only if not already logged in
  ├── newIsolatedPage()     → creates a fresh browser context (no cookies)
  └── closeBrowser()        → closes everything after all tests finish
```

---

### 5.8 `utils/logger.js` — Structured Logging

```
logger.info('Login successful')
→ [2026-08-08 15:55:38] ✅ INFO  | Login successful

logger.warn('networkidle timed out — continuing anyway')
→ [2026-08-08 15:55:38] ⚠️  WARN  | networkidle timed out — continuing anyway

logger.error('Step failed')
→ [2026-08-08 15:55:38] ❌ ERROR | Step failed

logger.step('Clicking: #login-disable')
→ [2026-08-08 15:55:38] 🔷 STEP  | Clicking: #login-disable
```

---

### 5.9 `support/world.js` — Scenario Context Wiring

```
world.js
  ├── setDefaultTimeout(120000)   → max time any single step can run
  ├── BeforeAll                   → launches browser + performs one-time login
  ├── AfterAll                    → closes browser after all tests
  └── CustomWorld
        ├── init(tags)            → wires up correct page to 'this' per scenario
        └── teardown()            → cleans up isolated contexts after @login tests
```

---

### 5.10 `support/hooks.js` — Lifecycle Events

```
Before(scenario)    → logs scenario start, calls this.init(tags)
AfterStep(result)   → captures screenshot on step failure, attaches to Allure
After(scenario)     → logs scenario result, calls this.teardown()
```

---

### 5.11 `cucumber.js` — Test Runner Configuration

Two profiles defined:

| Profile | Command | Workers | Use Case |
|---|---|---|---|
| `default` | `npm test` | 1 (sequential) | Standard run |
| `parallel` | `npm run test:parallel` | 3 (concurrent) | Faster CI runs |

---

## 6. Session Strategy — Core Design Decision

```
                    ┌─────────────────────────────────────┐
                    │         Test Run Starts              │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  BeforeAll: Launch Chromium browser  │
                    │  BeforeAll: Login ONCE               │
                    │  → sharedPage is now authenticated   │
                    └──────────────┬──────────────────────┘
                                   │
              ┌────────────────────┴────────────────────┐
              │                                         │
              ▼                                         ▼
   Scenario tagged @login                  Scenario tagged @dashboard
              │                                         │
              ▼                                         ▼
   newIsolatedPage()                        getSharedPage()
   Fresh context, no cookies                Already logged-in page
   Required for login UI tests              No login overhead
              │                                         │
              ▼                                         ▼
   Run scenario steps                       Run scenario steps
              │                                         │
              ▼                                         ▼
   teardown() → close isolated context      teardown() → do nothing
```

**Why @login tests need isolation:** Negative login tests need a browser with NO active session. If they reused the shared page, the user would already be logged in and the test would be invalid.

**Why @dashboard tests share a session:** Logging in before every dashboard scenario wastes 15-20 seconds per test. The shared session is established once and reused across all 6 loan search scenarios.

---

## 7. Tag System

| Tag | Run Command | Session | Purpose |
|---|---|---|---|
| `@login` | `npm run test:login` | Isolated per scenario | Login UI tests |
| `@dashboard` | `npm run test:dashboard` | Shared logged-in | Loan search tests |
| `@smoke` | `npm run test:smoke` | Depends on feature tag | Core happy-path tests |
| `@negative` | `npm run test:negative` | Isolated (login feature) | Error path tests |
| `@loanid` | `npm run test:loanid` | Shared | Loan ID search only |
| `@name` | `npm run test:name` | Shared | Name search only |
| `@street` | `cucumber-js --tags @street` | Shared | Street search only |
| `@city` | `cucumber-js --tags @city` | Shared | City search only |
| `@state` | `cucumber-js --tags @state` | Shared | State search only |
| `@zipcode` | `cucumber-js --tags @zipcode` | Shared | Zipcode search only |

---

## 8. Test Scenarios

### Total: 9 Scenarios across 2 feature files

| # | Feature | Scenario | Tags | Status |
|---|---|---|---|---|
| 1 | Login | Successful login with valid credentials | @login @smoke | ✅ Pass |
| 2 | Login | Login fails with invalid credentials | @login @negative | ✅ Pass |
| 3 | Login | Login fails with empty credentials | @login @negative | ✅ Pass |
| 4 | Loan Search | Search by Loan ID returns results | @dashboard @smoke @loanid | ✅ Pass |
| 5 | Loan Search | Search by Name returns results | @dashboard @smoke @name | ✅ Pass |
| 6 | Loan Search | Search by Street returns results | @dashboard @smoke @street | ✅ Pass |
| 7 | Loan Search | Search by City returns results | @dashboard @smoke @city | ✅ Pass |
| 8 | Loan Search | Search by State returns results | @dashboard @smoke @state | ✅ Pass |
| 9 | Loan Search | Search by Zipcode returns results | @dashboard @smoke @zipcode | ✅ Pass |

---

## 9. CI/CD Pipeline

### GitHub Actions Workflow — `.github/workflows/ci.yml`

**Triggers:**
| Event | When |
|---|---|
| Push to `main` | Every code push |
| Pull Request to `main` | Every PR raised |
| Scheduled | Every Monday at 6AM UTC |
| Manual | GitHub Actions tab → Run workflow |

**Pipeline Stages:**
```
┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   Checkout   │──▶│  Setup Node  │──▶│   Install    │──▶│  Run Tests   │──▶│   Generate   │
│     Code     │   │  Java + deps │   │  Playwright  │   │  (Cucumber)  │   │Allure Report │
└──────────────┘   └──────────────┘   └──────────────┘   └──────────────┘   └──────┬───────┘
                                                                                     │
                                                          ┌──────────────────────────┘
                                                          │
                                          ┌───────────────┴───────────────┐
                                          ▼                               ▼
                                 Upload Artifacts                 Publish to
                                 (allure-results,               GitHub Pages
                                  allure-report)
```

**Environment:** `ubuntu-22.04` (pinned for Playwright 1.40.0 compatibility)

**Allure Report URL:**
```
https://navin-nagarajan-relevantz.github.io/Playwright_BDD_POC/allure-report
```

**GitHub Repository:**
```
https://github.com/navin-nagarajan-relevantz/Playwright_BDD_POC
```

**Secrets configured in GitHub:**

| Secret | Purpose |
|---|---|
| `BASE_URL` | Application URL |
| `VALID_USERNAME` | Valid login credentials |
| `VALID_PASSWORD` | Valid login credentials |
| `INVALID_USERNAME` | Invalid credentials for negative tests |
| `INVALID_PASSWORD` | Invalid credentials for negative tests |

---

## 10. Adding a New Feature — Checklist

Example: Adding a "Loan Details" feature.

```
1. features/loanDetails.feature
   └─ Add @loanDetails tag at the top
   └─ Write Gherkin scenarios (Given/When/Then)

2. pages/LoanDetailsPage.js
   └─ const LoanDetailsPage = require('./BasePage');
   └─ Define SELECTORS object at the top
   └─ Add methods for each action on that page

3. steps/loanDetailsSteps.js
   └─ Import { Given, When, Then } from @cucumber/cucumber
   └─ Write step definitions that call this.loanDetailsPage.*

4. support/world.js
   └─ Import LoanDetailsPage
   └─ Add: this.loanDetailsPage = new LoanDetailsPage(this.page);
      inside the init() method

5. cucumber.js
   └─ Add: '--require steps/loanDetailsSteps.js'
```

No changes needed to: `hooks.js`, `sessionManager.js`, `logger.js`, `allureReporter.js`, `env.js`, `BasePage.js`.

---

## 11. Data Flow Diagram

How data flows from a `.feature` file all the way to the browser:

```
loanSearch.feature
│
│  When I select search type "Loan ID" and enter "0"
│
└──► dashboardSteps.js
      │  When('I select search type {string} and enter {string}', async function(type, value) {
      │    await this.dashboardPage.fillSearch('loanid', '0');
      │    await this.dashboardPage.submitSearch();
      │  })
      │
      └──► world.js (this.dashboardPage = new DashboardPage(this.page))
            │
            └──► DashboardPage.js (extends BasePage)
                  │  fillSearch('loanid', '0')
                  │    └─ opens dropdown → selects radio → fills input
                  │
                  └──► BasePage.js
                        │  async click(selector) {
                        │    logger.step(`Clicking: ${selector}`);
                        │    await this.page.locator(selector).click();
                        │  }
                        │
                        ├──► logger.js → timestamped console output
                        │
                        └──► Playwright API → actual Chromium browser action
```

---

## 12. Key Takeaways

1. **Never put selectors in step files** — they belong in page objects only
2. **Never hardcode URLs or credentials** — they belong in `config/env.js` and `.env` only
3. **Always extend BasePage** for new page objects — never call Playwright directly from pages
4. **Tag your features correctly** — `@login` = isolated session, `@dashboard` = shared session
5. **Steps should be thin** — one line calling a page method, not browser logic
6. **The World (`this`)** is your scenario's context — page objects live on it, set up in `world.js`
7. **SessionManager is a singleton** — one browser, one shared login, for the entire test run
8. **CI runs automatically** — every push to `main` triggers the full pipeline and updates the Allure report on GitHub Pages
