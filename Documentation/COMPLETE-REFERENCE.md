# BDD Automation Framework — Complete Technical Reference
### Playwright + Cucumber.js + Allure Reporting
> Built for **Newrez / Shellpoint Mortgage Servicing — Insight Portal**

---

## Table of Contents

1. [Framework Overview](#1-framework-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Structure](#3-project-structure)
4. [Installation Guide](#4-installation-guide)
5. [Run Tests](#5-run-tests)
6. [Framework Architecture](#6-framework-architecture)
7. [Session Strategy](#7-session-strategy)
8. [Tag System](#8-tag-system)
9. [Test Scenarios](#9-test-scenarios)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Adding a New Feature](#11-adding-a-new-feature)
12. [Common Issues & Fixes](#12-common-issues--fixes)

---

## 1. Framework Overview

This is an enterprise-grade BDD automation framework built for the Shellpoint Insight Portal. It uses Playwright for browser automation, Cucumber.js for BDD test execution, and Allure for rich HTML reporting.

**Design Principles:**
- Smart session management — login once, reuse across scenarios
- Single source of truth — all config in one place
- Page Object Model — selectors and actions fully encapsulated
- Structured logging — every step timestamped and traceable
- Auto screenshot on failure — attached directly to Allure report
- CI/CD ready — GitHub Actions pipeline with Allure report on GitHub Pages

---

## 2. Technology Stack

| Tool | Version | Purpose |
|---|---|---|
| **Node.js** | v18.x (LTS) | JavaScript runtime |
| **npm** | v8.x or higher | Package manager |
| **Playwright** | 1.40.0 | Browser automation engine |
| **Cucumber.js** | 7.3.2 | BDD test runner — reads `.feature` files |
| **@playwright/test** | 1.40.0 | Assertion library (`expect`) |
| **allure-cucumberjs** | 2.15.1 | Allure + Cucumber integration |
| **allure-commandline** | 2.27.0 | Allure HTML report generator |
| **dotenv** | 17.x | Loads credentials from `.env` file |
| **Git** | v2.x or higher | Version control |
| **Java JDK** | 17 (LTS) | Required by Allure CLI |
| **VS Code** | Latest | Recommended code editor |

---

## 3. Project Structure

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
├── Documentation/
│   └── COMPLETE-REFERENCE.md     ← This file
├── .env                          ← Real credentials (excluded from Git)
├── .env.example                  ← Template for new team members
├── .gitignore                    ← Excludes .env, node_modules, allure-results
├── cucumber.js                   ← Cucumber runner configuration
└── package.json                  ← Scripts and dependencies
```

---

## 4. Installation Guide

### 4.1 Prerequisites — What You Need to Install

| Tool | Required Version | Purpose |
|---|---|---|
| **Node.js** | v18.x (LTS) | JavaScript runtime |
| **npm** | v8.x or higher | Package manager |
| **Git** | v2.x or higher | Version control |
| **VS Code** | Latest | Code editor |
| **Java JDK** | v17 (LTS) | Required by Allure report tool |
| **Allure CLI** | v2.x or higher | Generates HTML test report |

---

### 4.2 Step 1 — Install Node.js

1. Go to: https://nodejs.org/en/download
2. Click **LTS** → Download **Windows Installer (.msi)** 64-bit
3. Run the installer → click **Next → Next → Install → Finish**
4. Check **"Automatically install the necessary tools"** if it appears

Verify:
```bash
node --version    # v18.0.0 or higher
npm --version     # 8.6.0 or higher
```

---

### 4.3 Step 2 — Install Git

1. Go to: https://git-scm.com/download/win
2. Run the installer → keep all default settings
3. On "Adjusting your PATH" → select **"Git from the command line and also from 3rd-party software"**

Verify:
```bash
git --version    # git version 2.52.0.windows.1 or similar
```

---

### 4.4 Step 3 — Install Visual Studio Code

1. Go to: https://code.visualstudio.com/download
2. Download and run the Windows installer
3. Check these boxes during install:
   - Add "Open with Code" to Windows Explorer file context menu
   - Add "Open with Code" to Windows Explorer directory context menu
   - Add to PATH

**Recommended VS Code Extensions:**

| Extension | Purpose |
|---|---|
| Cucumber (Gherkin) Full Support | Syntax highlighting for `.feature` files |
| Playwright Test for VSCode | Run and debug Playwright tests |
| ESLint | Highlights JavaScript errors as you type |
| GitLens | See Git history inside VS Code |
| Amazon Q | AI assistant for coding help |

---

### 4.5 Step 4 — Install Java JDK

1. Go to: https://adoptium.net/temurin/releases/
2. Select: Version **17** → OS **Windows** → Architecture **x64** → Package **JDK**
3. Download and run the `.msi` installer → keep all defaults

Verify:
```bash
java -version    # java version "17.0.10" or higher
```

---

### 4.6 Step 5 — Install Allure CLI

```bash
npm install -g allure-commandline
```

Verify:
```bash
npx allure --version    # 2.43.0 or higher
```

---

### 4.7 Step 6 — Get the Project Code

```bash
git clone https://github.com/navin-nagarajan-relevantz/Playwright_BDD_POC.git
cd Playwright_BDD_POC
```

---

### 4.8 Step 7 — Install Project Dependencies

```bash
npm install
```

Key packages installed:

| Package | Version | Purpose |
|---|---|---|
| `@cucumber/cucumber` | 7.3.2 | BDD test runner |
| `playwright` | 1.40.0 | Browser automation engine |
| `@playwright/test` | 1.40.0 | Assertion library |
| `allure-cucumberjs` | 2.15.1 | Allure + Cucumber integration |
| `allure-commandline` | 2.27.0 | Report generator CLI |

---

### 4.9 Step 8 — Install Playwright Browser

```bash
npx playwright install chromium
```

---

### 4.10 Step 9 — Configure Environment

```bash
copy .env.example .env
```

Open `.env` and fill in the real values:

```
BASE_URL=https://insight2.test.shellpointmortgageservicing.com
VALID_USERNAME=your_username
VALID_PASSWORD=your_password
INVALID_USERNAME=invalid_user
INVALID_PASSWORD=wrong_password
BROWSER_HEADLESS=false
BROWSER_SLOW_MO=80
TIMEOUT_DEFAULT=120000
TIMEOUT_LOGIN=120000
TIMEOUT_ELEMENT=15000
TIMEOUT_NAVIGATION=120000
```

> Never commit `.env` to Git — it is excluded by `.gitignore`.

---

### 4.11 Verify Everything is Ready

```bash
node --version             # v18.0.0
npm --version              # 8.6.0
git --version              # git version 2.52.0.windows.1
java -version              # java version "17.0.10"
npx allure --version       # 2.43.0
npx playwright --version   # Version 1.40.0
npx cucumber-js --version  # 7.3.2
```

---

## 5. Run Tests

### Run Commands

```bash
# Run all tests
npm test

# Run by feature
npm run test:login
npm run test:dashboard

# Run by tag
npm run test:smoke
npm run test:negative

# Run individual search types
npm run test:loanid
npm run test:name

# Run all tests + generate Allure report
npm run test:report

# Open Allure report in browser
npm run report:open
```

### Generate & View Allure Report

```bash
npm run report:generate    # generates allure-report/ from allure-results/
npm run report:open        # opens report in browser
```

**Live Allure Report (CI):**
```
https://navin-nagarajan-relevantz.github.io/Playwright_BDD_POC/allure-report
```

---

## 6. Framework Architecture

### 6.1 Big Picture — How Everything Connects

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

---

### 6.2 Execution Flow — Step by Step

```
Step 1 ── cucumber.js is read
           └─ Loads features/**/*.feature
           └─ Requires world.js → hooks.js → steps/*.js
           └─ Formats output via allureReporter.js

Step 2 ── BeforeAll fires ONCE
           └─ Launches Chromium browser
           └─ Performs one-time login → shared authenticated page stored in memory

Step 3 ── For each Scenario:
           └─ Before hook fires
               ├─ @login tag  → creates a FRESH isolated browser page
               └─ other tags  → reuses the SHARED logged-in page

Step 4 ── Cucumber matches each Gherkin step to a step definition
           └─ Step definitions call Page Object methods
           └─ Page Objects call BasePage methods
           └─ BasePage calls Playwright browser API
           └─ logger.js logs every action with timestamp

Step 5 ── AfterStep fires after EVERY step
           └─ If step FAILED → captures full-page screenshot → attaches to Allure

Step 6 ── After hook fires after each Scenario
           ├─ @login scenario → closes isolated browser context
           └─ @dashboard scenario → does nothing (shared session preserved)

Step 7 ── AfterAll fires ONCE
           └─ Closes browser entirely

Step 8 ── Allure results written to allure-results/
```

---

### 6.3 Module Responsibilities

**`config/env.js`** — Single source of truth. All URLs, credentials, timeouts, and browser settings loaded from `.env`. No magic strings anywhere else in the codebase.

**`features/*.feature`** — Plain English test scenarios written in Gherkin (Given/When/Then). Readable by non-technical stakeholders.

**`pages/BasePage.js`** — Base class wrapping Playwright calls with built-in waiting, logging, and timeout handling. All page objects extend this. If Playwright's API changes, fix it in one place.

**`pages/LoginPage.js`** — All login page selectors and actions. Extends BasePage.

**`pages/DashboardPage.js`** — All dashboard search selectors and actions. Handles dropdown open/close, radio selection, input filling, result verification. Extends BasePage.

**`steps/loginSteps.js`** — Thin bridge between `login.feature` and `LoginPage`. No selectors, no browser logic.

**`steps/dashboardSteps.js`** — Thin bridge between `loanSearch.feature` and `DashboardPage`. No selectors, no browser logic.

**`utils/sessionManager.js`** — Module-level singleton. Manages browser lifecycle. Enables login-once strategy. Provides isolated pages for `@login` tests.

**`utils/logger.js`** — Timestamped structured logging with 4 levels: INFO ✅, WARN ⚠️, ERROR ❌, STEP 🔷.

**`support/world.js`** — The `this` context for every step and hook. Sets up page objects per scenario. Wires correct session (shared vs isolated) based on tags.

**`support/hooks.js`** — Before/AfterStep/After lifecycle hooks. Captures screenshots on failure.

**`support/allureReporter.js`** — Connects Cucumber output to Allure reporting engine.

**`cucumber.js`** — Runner config. Defines `default` (sequential) and `parallel` (3 workers) profiles.

---

### 6.4 DashboardPage Search Flow

```
fillSearch(type, value)
  Step 1 → click dropdown toggle       (.search-by .dropdown-toggle)
  Step 2 → click radio button          (label:has(#loanid))
  Step 3 → fill input while open       (.form-control.others)

fillNameSearch(firstName, lastName)
  Step 1 → click dropdown toggle
  Step 2 → click name radio button     (label:has(#name))
  Step 3 → fill first name input       (input[placeholder="Enter First Name"])
  Step 4 → fill last name input        (input[placeholder="Enter Last Name"])

submitSearch()
  Step 1 → click search button         (.input-group-append)
  Step 2 → _waitForPageFullyLoaded()
             → domcontentloaded
             → spinner appears then disappears
             → networkidle
             → DOM probe (logs selector counts for debugging)
             → fail fast if 500 error page detected
```

---

## 7. Session Strategy

The most important architectural decision — controls how the browser is managed per scenario.

```
                    ┌─────────────────────────────────────┐
                    │         Test Run Starts              │
                    └──────────────┬──────────────────────┘
                                   │
                                   ▼
                    ┌─────────────────────────────────────┐
                    │  BeforeAll: Launch Chromium          │
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

## 8. Tag System

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

## 9. Test Scenarios

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

## 10. CI/CD Pipeline

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
Checkout → Setup Node/Java → Install deps → Install Playwright
    → Create .env → Run Tests → Generate Allure Report
    → Upload Artifacts → Publish to GitHub Pages
```

**Environment:** `ubuntu-22.04` (pinned for Playwright 1.40.0 compatibility)

**GitHub Secrets configured:**

| Secret | Purpose |
|---|---|
| `BASE_URL` | Application URL |
| `VALID_USERNAME` | Valid login username |
| `VALID_PASSWORD` | Valid login password |
| `INVALID_USERNAME` | Invalid username for negative tests |
| `INVALID_PASSWORD` | Invalid password for negative tests |

**Links:**

| What | URL |
|---|---|
| GitHub Repository | https://github.com/navin-nagarajan-relevantz/Playwright_BDD_POC |
| Pipeline | https://github.com/navin-nagarajan-relevantz/Playwright_BDD_POC/actions |
| Allure Report | https://navin-nagarajan-relevantz.github.io/Playwright_BDD_POC/allure-report |

---

## 11. Adding a New Feature

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

> No changes needed to: `hooks.js`, `sessionManager.js`, `logger.js`, `allureReporter.js`, `env.js`, `BasePage.js`

---

## 12. Common Issues & Fixes

### `npm` is not recognized
Node.js was not added to PATH. Reinstall Node.js and check "Add to PATH" during installation. Restart terminal.

---

### `allure` is not recognized after install
```bash
npm config get prefix
```
Add that path + `\node_modules\.bin` to Windows Environment Variables → PATH. Restart terminal.

---

### `npx playwright install chromium` fails
You may be behind a corporate proxy/firewall. Try:
```bash
npx playwright install chromium --with-deps
```
Or contact IT to whitelist `playwright.azureedge.net`.

---

### Tests fail with "browser not found"
```bash
npx playwright install chromium
```

---

### `java` is not recognized
Java was not added to PATH. After installing JDK:
1. Press `Win + S` → search "Environment Variables"
2. Edit the system environment variables → Environment Variables
3. Under System Variables → find `Path` → Edit
4. Click New → add: `C:\Program Files\Eclipse Adoptium\jdk-17\bin`
5. Click OK → OK → OK → restart terminal
