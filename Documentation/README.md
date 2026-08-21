# 🏆 Enterprise BDD Automation Framework
### Playwright + Cucumber.js + Allure Reporting

> Built for **Newrez / Shellpoint Mortgage Servicing — Insight Portal**
> Designed for scalability, maintainability, and long-term growth.

---

## 🧱 Tech Stack

| Tool | Purpose |
|---|---|
| **Playwright** | Cross-browser automation engine |
| **Cucumber.js** | BDD / Gherkin test runner |
| **Allure** | Rich HTML test reporting |
| **Node.js** | Runtime environment |

---

## 📁 Project Structure

```
├── config/
│   └── env.js                  # Central config — URL, credentials, timeouts, browser
├── Documentation/
│   ├── README.md               # This file — framework overview
│   ├── FRAMEWORK_ARCHITECTURE.md  # Deep-dive architecture guide
│   ├── INSTALLATION-GUIDE.md   # Step-by-step installation guide
│   └── QA-Onboarding-Guide.html   # Visual onboarding guide
├── features/
│   ├── login.feature           # Login scenarios (positive + negative)
│   └── loanSearch.feature      # Dashboard loan search scenarios
├── pages/
│   ├── BasePage.js             # Reusable base actions with built-in waits & logging
│   ├── LoginPage.js            # Login page object
│   └── DashboardPage.js        # Dashboard page object
├── steps/
│   ├── loginSteps.js           # Login step definitions
│   └── dashboardSteps.js       # Dashboard step definitions
├── support/
│   ├── world.js                # Tag-aware session management
│   ├── hooks.js                # Before/After hooks + screenshot on failure
│   └── allureReporter.js       # Allure formatter integration
├── utils/
│   ├── logger.js               # Structured timestamped logger
│   └── sessionManager.js       # Smart browser session — login once, reuse or isolate
├── cucumber.js                 # Cucumber configuration
└── README.md                   # Root entry point → links to Documentation/
```

---

## ⚙️ Setup

```bash
npm install
npx playwright install chromium
```

---

## 🚀 Run Tests

```bash
# Run all tests
npm test

# Run by feature
npm run test:login
npm run test:dashboard

# Run by tag
npm run test:smoke
npm run test:negative
```

---

## 📊 Generate Allure Report

```bash
npm run test:report
npm run report:open
```

---

## 🏗️ Framework Design Principles

### 1. Smart Session Management
- `@login` scenarios → **isolated browser** per scenario (required for negative tests)
- `@dashboard` scenarios → **shared session**, login happens **once** via `BeforeAll`
- Adding new features never requires changes to the core framework

### 2. Single Source of Truth
All environment config (URL, credentials, timeouts, browser settings) lives in `config/env.js`

### 3. Page Object Model (POM)
Every page has its own class extending `BasePage`. Selectors and actions are fully encapsulated.

### 4. Structured Logging
Every step is logged with timestamp, level, and action — making debugging effortless.

### 5. Auto Screenshot on Failure
`AfterStep` hook captures a full-page screenshot on any failure and attaches it to the Allure report.

---

## 🏷️ Tags

| Tag | Description |
|---|---|
| `@login` | Login feature — isolated browser per scenario |
| `@dashboard` | Dashboard feature — shared session |
| `@smoke` | Core happy-path scenarios |
| `@negative` | Error / failure scenarios |

---

## ➕ Adding New Features

1. Create `features/newFeature.feature` with `@newFeature` tag
2. Create `pages/NewFeaturePage.js` extending `BasePage`
3. Create `steps/newFeatureSteps.js`
4. Register page in `support/world.js`
5. Add step file to `cucumber.js`

> Zero changes to core framework files needed.
