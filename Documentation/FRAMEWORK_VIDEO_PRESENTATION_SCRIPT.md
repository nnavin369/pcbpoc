# 🎥 Video Presentation Script & Storyboard
## Automation Framework Video Walkthrough (Playwright + Cucumber BDD + POM + Allure)

> **Target Audience:** New QA Joiners, Manual Testers, Automation Engineers, Product Owners  
> **Estimated Duration:** 10 – 12 Minutes  
> **Topic:** End-to-End Walkthrough of the Shellpoint Insight Test Automation Framework

---

### 🎬 Scene 1: Introduction & Architecture Overview (0:00 – 1:30)
**Visual on Screen:**
- Display Project Title Slide & High-Level Architecture Diagram.
- Highlight the 4 Pillars: **Cucumber BDD**, **Playwright**, **Page Object Model (POM)**, and **Allure Reports**.

**Spoken Narrative / Voiceover:**
> *"Welcome everyone to the walkthrough of our modern Test Automation Framework for the Shellpoint Insight application. This framework is built from the ground up using Playwright, Cucumber BDD, and the Page Object Model design pattern.*
> 
> *Our goal is to make automated tests readable for non-developers while providing lightning-fast execution, background API validation, and rich visual Allure reporting with failure screenshots and videos.*
>
> *Let's take a quick look at how the project is organized and how our tests execute."*

---

### 🎬 Scene 2: Folder Structure Tour (1:30 – 3:00)
**Visual on Screen:**
- VS Code explorer showing `config/`, `features/`, `steps/`, `pages/`, `utils/`, `support/`, and `Documentation/`.

**Spoken Narrative / Voiceover:**
> *"In our project root:
> 1. `features/` contains our plain-English BDD test scenarios written in Gherkin syntax. Anyone on the team can read and understand them.
> 2. `steps/` translates those Gherkin steps into actual automation instructions.
> 3. `pages/` contains our Page Objects. This is where all HTML selectors, button clicks, and tab interactions live.
> 4. `utils/` holds our core engine helpers: `logger.js` for masked logging, `apiInterceptor.js` for network traffic analysis, and `sessionManager.js` for managing browser sessions.
> 5. `support/` handles Cucumber lifecycle hooks, such as taking screenshots on step failures and managing failure videos."*

---

### 🎬 Scene 3: Feature Files & Plain-English BDD (3:00 – 4:30)
**Visual on Screen:**
- Open `features/loanSearchApiValidation.feature` and `features/loanDetailsTabs.feature`.

**Spoken Narrative / Voiceover:**
> *"Here is an example feature file: `loanSearchApiValidation.feature`. Notice how clean and readable it is:
> - `Given I am on the dashboard`
> - `When I search for Loan ID "555835905" with API response capture`
> - `Then the API response status code should be 200`
> - `And the API response field "Address" from "/DataApi/Info/InfoById/" should contain "110 Main Street"`
>
> *We can also pass data tables to verify multiple JSON properties like InvestorId, Borrower 1, and Borrower 2 in a single readable step."*

---

### 🎬 Scene 4: Page Object Model & Security Masking (4:30 – 6:30)
**Visual on Screen:**
- Open `pages/BasePage.js` and `pages/LoanDetailsPage.js`.

**Spoken Narrative / Voiceover:**
> *"In `BasePage.js`, we wrap Playwright actions with built-in stability and security:
> - Every action automatically waits for elements to be visible before clicking or typing.
> - Notice our password masking logic: whenever a password field is filled, the value is automatically masked as asterisks in the logs, ensuring zero credentials are ever exposed in terminal output or CI/CD logs.
>
> *In `LoanDetailsPage.js`, we handle all 14 loan detail tabs. When navigating to tabs under the 'More' dropdown menu—like Taxes and Insurance or Flood Occupancy—the framework expands the menu, applies a visual focus highlight, and clicks the tab seamlessly."*

---

### 🎬 Scene 5: Real-Time API Interception (6:30 – 8:00)
**Visual on Screen:**
- Open `utils/apiInterceptor.js` and show the captured API console logs.

**Spoken Narrative / Voiceover:**
> *"One of the most powerful features of this framework is `apiInterceptor.js`.
> While the browser interacts with the UI, the interceptor records all background XHR and Fetch calls sent by the application.
> It captures the HTTP status codes, response headers, and parses JSON response bodies.
> This allows us to validate backend business data without needing separate Postman collections or API test runners."*

---

### 🎬 Scene 6: Running the Tests (8:00 – 9:30)
**Visual on Screen:**
- Terminal running `npm test` and `npm run test:api`.

**Spoken Narrative / Voiceover:**
> *"Running tests is very straightforward:
> - `npm test` runs the complete suite in our four ordered phases: Authentication, Search, Multi-Tab verification, and API Validation.
> - `npm run test:api` runs our API payload checks.
> - `npm run test:loantabs` verifies all 14 tabs with our interactive summary table.
>
> *Let's run `npm run test:api` and watch the clean, masked logs in real time."*

---

### 🎬 Scene 7: Allure Reports & Failure Artifacts (9:30 – 11:30)
**Visual on Screen:**
- Open live Allure report in browser (`http://127.0.0.1:53489`).
- Showcase HTML Summary Tables, Green/Red status badges, attached JSON payloads, and video playback on failure.

**Spoken Narrative / Voiceover:**
> *"Once tests complete, we generate our Allure report using `npm run report:generate` and open it with `npm run report:open`.
> In the report:
> - You can see the color-coded summary tables with green PASS and red FAIL badges.
> - Full backend API responses are attached in pretty-printed JSON format.
> - If a test fails, Playwright instantly attaches a full-page screenshot and high-definition video recording directly to the failed test overview.
> - For passing tests, temporary videos are automatically deleted to keep reports fast and lightweight."*

---

### 🎬 Scene 8: Wrap-up & Getting Started (11:30 – 12:00)
**Visual on Screen:**
- Display `Documentation/` folder links and quick-start command cheatsheet.

**Spoken Narrative / Voiceover:**
> *"Everything we covered today is documented in detail inside the `Documentation/` directory, including our complete architecture guide, onboarding steps, and CI/CD workflow references.
> Thank you for watching, and happy testing!"*
