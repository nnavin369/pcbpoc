# 🛠️ Technical Installation Guide
## Newrez BDD Automation Framework — Playwright + Cucumber.js + Allure

> This guide walks you through installing **every tool** needed to run this project
> on a **Windows machine** — from scratch, step by step.

---

## 📋 What You Need to Install

| Tool | Required Version | Installed Version | Purpose |
|---|---|---|---|
| **Node.js** | v18.x (LTS) | v18.0.0 | JavaScript runtime — required to run the framework |
| **npm** | v8.x or higher | v8.6.0 | Package manager — installs all project dependencies |
| **Git** | v2.x or higher | v2.52.0 | Version control — to clone/pull the project code |
| **VS Code** | Latest | Latest | Code editor — recommended for editing and running tests |
| **Java JDK** | v8 or higher | v17.0.10 | Required by Allure report tool |
| **Allure CLI** | v2.x or higher | v2.43.0 | Generates and opens the HTML test report |
| **Playwright** | 1.40.0 | 1.40.0 | Browser automation engine |
| **Cucumber.js** | 7.3.2 | 7.3.2 | BDD test runner |

---

## STEP 1 — Install Node.js

Node.js is the engine that runs JavaScript on your computer.
This project requires **Node.js version 18**.

> ✅ Verified working version: **v18.0.0**

### How to Install:
1. Open your browser and go to: https://nodejs.org/en/download
2. Click **"LTS"** (Long Term Support) — this is the stable version
3. Download the **Windows Installer (.msi)** — 64-bit
4. Run the downloaded `.msi` file
5. Click **Next → Next → Install** (keep all default settings)
6. Check the box **"Automatically install the necessary tools"** if it appears
7. Click **Finish**

### Verify Installation:
Open **Command Prompt** (press `Win + R`, type `cmd`, press Enter) and run:
```
node --version
```
You should see: `v18.0.0` or higher

```
npm --version
```
You should see: `8.6.0` or higher

> ✅ If you see version numbers, Node.js is installed correctly.
> ❌ If you see "not recognized", restart your computer and try again.

---

## STEP 2 — Install Git

Git is used to download (clone) the project code from the repository.

### How to Install:
1. Go to: https://git-scm.com/download/win
2. The download starts automatically — run the installer
3. Click **Next** through all steps (keep all default settings)
4. On the "Adjusting your PATH" screen — select **"Git from the command line and also from 3rd-party software"**
5. Click **Next → Install → Finish**

### Verify Installation:
```
git --version
```
You should see: `git version 2.52.0.windows.1` or similar

---

## STEP 3 — Install Visual Studio Code (VS Code)

VS Code is the recommended code editor for this project.

### How to Install:
1. Go to: https://code.visualstudio.com/download
2. Click **Windows** to download the installer
3. Run the installer
4. Check these boxes during installation:
   - ✅ Add "Open with Code" action to Windows Explorer file context menu
   - ✅ Add "Open with Code" action to Windows Explorer directory context menu
   - ✅ Add to PATH
5. Click **Install → Finish**

### Recommended VS Code Extensions:
After installing VS Code, install these extensions:
1. Open VS Code
2. Press `Ctrl + Shift + X` to open Extensions panel
3. Search and install each one:

| Extension | Why You Need It |
|---|---|
| **Cucumber (Gherkin) Full Support** | Syntax highlighting for .feature files |
| **Playwright Test for VSCode** | Run and debug Playwright tests |
| **ESLint** | Highlights JavaScript errors as you type |
| **GitLens** | See Git history and blame inside VS Code |
| **Amazon Q** | AI assistant for coding help |

---

## STEP 4 — Install Java JDK

Java is required by the Allure report tool to generate HTML reports.

### How to Install:
1. Go to: https://adoptium.net/temurin/releases/
2. Select:
   - Version: **17** (LTS) — this is the verified working version
   - OS: **Windows**
   - Architecture: **x64**
   - Package Type: **JDK**
3. Download the `.msi` installer
4. Run the installer — keep all default settings
5. Click **Install → Finish**

### Verify Installation:
```
java -version
```
You should see: `java version "17.0.10"` or higher

---

## STEP 5 — Install Allure Command Line Tool

Allure generates the beautiful HTML test report after your tests run.

### How to Install (using npm — easiest way):
```
npm install -g allure-commandline
```

> ✅ Verified working version: **2.43.0**

### Verify Installation:
```
allure --version
```
You should see: `2.43.0` or higher

> ⚠️ If `allure` command is not found, use `npx allure --version` instead.
>    This project also works with `npx allure` for all report commands.

> ⚠️ If `allure` command is not found after install, try restarting your terminal.

---

## STEP 6 — Get the Project Code

### Option A — Clone from Git repository:
```
git clone <your-repository-url>
cd Newrezaq_POC
```

### Option B — If you already have the project folder:
```
cd d:\Newrez\Newrezaq_POC
```

---

## STEP 7 — Install Project Dependencies

This installs all the JavaScript packages the project needs
(Playwright, Cucumber, Allure, etc.) — defined in `package.json`.

```
npm install
```

> This may take 1-2 minutes. You will see packages being downloaded.
> You should see: `added X packages` when complete.

Key packages that will be installed with their exact versions:

| Package | Version | Purpose |
|---|---|---|
| `@cucumber/cucumber` | 7.3.2 | BDD test runner |
| `playwright` | 1.40.0 | Browser automation engine |
| `@playwright/test` | 1.40.0 | Assertion library (expect) |
| `allure-cucumberjs` | 2.15.1 | Allure + Cucumber integration |
| `allure-commandline` | 2.27.0 | Report generator CLI |

---

## STEP 8 — Install Playwright Browser

This downloads the Chromium browser that Playwright uses to run tests.

```
npx playwright install chromium
```

> This downloads ~150MB. Wait for it to complete.
> You should see: `Chromium 119.x.x (playwright build 1084) downloaded`
>
> ✅ Verified working with: **Playwright v1.40.0 + Chromium build 1084**

---

## ✅ Verify Everything is Ready

Run this checklist in your terminal and match the versions below:

```
node --version        → v18.0.0
npm --version         → 8.6.0
git --version         → git version 2.52.0.windows.1
java -version         → java version "17.0.10"
npx allure --version  → 2.43.0
npx playwright --version   → Version 1.40.0
npx cucumber-js --version  → 7.3.2
```

---

## 🚀 Run Your First Test

Once all installations are complete, open terminal in the project folder and run:

```
# Run the name search test
npm run test:name

# Run all loan search tests
npm run test:loansearch

# Run all tests and generate report
npm run test:report

# Open the report in browser
npm run report:open
```

---

## ❓ Common Issues & Fixes

### Issue: `npm` is not recognized
**Fix:** Node.js was not added to PATH. Reinstall Node.js and check
"Add to PATH" during installation. Then restart your terminal.

---

### Issue: `allure` is not recognized after `npm install -g allure-commandline`
**Fix:** Run this command to find where npm installs global packages:
```
npm config get prefix
```
Add that path + `\node_modules\.bin` to your Windows Environment Variables → PATH.
Then restart your terminal.

---

### Issue: `npx playwright install chromium` fails
**Fix:** You may be behind a corporate proxy/firewall. Try:
```
npx playwright install chromium --with-deps
```
Or contact your IT team to whitelist `playwright.azureedge.net`

---

### Issue: Tests fail with "browser not found"
**Fix:** Re-run the browser install:
```
npx playwright install chromium
```

---

### Issue: `java` is not recognized
**Fix:** Java was not added to PATH. After installing JDK:
1. Press `Win + S` → search "Environment Variables"
2. Click "Edit the system environment variables"
3. Click "Environment Variables"
4. Under "System Variables" → find `Path` → click Edit
5. Click New → add: `C:\Program Files\Eclipse Adoptium\jdk-21\bin`
6. Click OK → OK → OK
7. Restart your terminal

---

## 📁 Project Folder Structure (Quick Reference)

```
Newrezaq_POC/
├── config/
│   └── env.js                ← Change URL, credentials, timeouts here
├── Documentation/
│   ├── README.md             ← Framework overview
│   ├── FRAMEWORK_ARCHITECTURE.md  ← Architecture deep-dive
│   ├── INSTALLATION-GUIDE.md ← This file
│   └── QA-Onboarding-Guide.html   ← Full onboarding guide (open in browser)
├── features/
│   ├── login.feature         ← Login test scenarios (plain English)
│   └── loanSearch.feature    ← Loan search test scenarios (plain English)
├── pages/
│   ├── BasePage.js           ← Common actions (click, fill, getText)
│   ├── LoginPage.js          ← Login page interactions
│   └── DashboardPage.js      ← Dashboard search interactions
├── steps/
│   ├── loginSteps.js         ← Connects login.feature to LoginPage
│   └── dashboardSteps.js     ← Connects loanSearch.feature to DashboardPage
├── support/
│   ├── world.js              ← Browser session setup
│   ├── hooks.js              ← Before/After hooks + screenshots
│   └── allureReporter.js     ← Allure report integration
├── utils/
│   ├── logger.js             ← Console logging
│   └── sessionManager.js     ← Login-once session management
├── cucumber.js               ← Cucumber runner configuration
├── package.json              ← Project scripts and dependencies
└── README.md                 ← Root entry point → links to Documentation/
```

---

## 📞 Need Help?

1. Read the comments inside each file — every file is fully documented
2. Open `QA-Onboarding-Guide.html` in your browser for a visual guide
3. Check the **Common Issues** section above
4. Ask your team lead or senior QA engineer
