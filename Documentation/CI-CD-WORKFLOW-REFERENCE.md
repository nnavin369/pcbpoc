# CI/CD Workflow — Technical Reference

**File:** `.github/workflows/ci.yml`
**Framework:** Playwright + Cucumber.js + Allure Reporting
**Project:** Newrez / Shellpoint Mortgage Servicing — Insight Portal

---

## Workflow Overview

| Property | Value |
|---|---|
| Workflow Name | `Playwright BDD Tests` |
| Runner | `ubuntu-22.04` |
| Node.js Version | `18` |
| Java Version | `17 (Temurin)` |
| Browser | `Chromium (headless)` |
| Report Hosting | GitHub Pages (`gh-pages` branch) |

---

## Triggers

```yaml
on:
  push:
    branches: [main]         # Runs on every push to main
  pull_request:
    branches: [main]         # Runs on every PR targeting main
  schedule:
    - cron: '0 6 * * 1'     # Every Monday at 6:00 AM UTC
  workflow_dispatch:          # Manual trigger from GitHub Actions UI
```

| Trigger | When It Fires |
|---|---|
| `push` | Any commit pushed to `main` |
| `pull_request` | Any PR opened/updated against `main` |
| `schedule` | Weekly — Monday 6:00 AM UTC |
| `workflow_dispatch` | Manually triggered from GitHub Actions tab |

---

## Permissions

```yaml
permissions:
  contents: write
```

`contents: write` is required so the workflow can push the generated Allure HTML report to the `gh-pages` branch via `peaceiris/actions-gh-pages`.

---

## Job: `test`

**Full name:** `Run BDD Tests & Publish Allure Report`

### Step-by-Step Execution

#### 1. Checkout Repository
```yaml
uses: actions/checkout@v4
```
Clones the repository into the runner so all source files are available.

---

#### 2. Setup Node.js
```yaml
uses: actions/setup-node@v4
with:
  node-version: '18'
  cache: 'npm'
```
Installs Node.js 18 and enables npm dependency caching to speed up subsequent runs.

---

#### 3. Setup Java
```yaml
uses: actions/setup-java@v4
with:
  distribution: 'temurin'
  java-version: '17'
```
Java 17 is required by the `allure-commandline` CLI tool to generate the HTML report.

---

#### 4. Install Dependencies
```yaml
run: npm ci
```
Installs exact versions from `package-lock.json`. Faster and more reliable than `npm install` in CI.

---

#### 5. Install Playwright Chromium
```yaml
run: npx playwright install --with-deps chromium
```
Downloads the Chromium browser binary along with all OS-level dependencies needed to run it headlessly on Ubuntu.

---

#### 6. Create `.env` File
```yaml
run: |
  echo "BASE_URL=${{ secrets.BASE_URL }}" >> .env
  echo "VALID_USERNAME=${{ secrets.VALID_USERNAME }}" >> .env
  echo "VALID_PASSWORD=${{ secrets.VALID_PASSWORD }}" >> .env
  echo "INVALID_USERNAME=${{ secrets.INVALID_USERNAME }}" >> .env
  echo "INVALID_PASSWORD=${{ secrets.INVALID_PASSWORD }}" >> .env
  echo "BROWSER_HEADLESS=true" >> .env
  echo "BROWSER_SLOW_MO=0" >> .env
  echo "TIMEOUT_DEFAULT=120000" >> .env
  echo "TIMEOUT_LOGIN=120000" >> .env
  echo "TIMEOUT_ELEMENT=15000" >> .env
  echo "TIMEOUT_NAVIGATION=120000" >> .env
```

Dynamically creates the `.env` file from GitHub Secrets. The `.env` file is never committed to the repository — credentials exist only in the runner's memory during the job.

**Secrets required in GitHub repository settings:**

| Secret Name | Description |
|---|---|
| `BASE_URL` | Application URL (e.g. `https://insight.newrez.com`) |
| `VALID_USERNAME` | Valid login username |
| `VALID_PASSWORD` | Valid login password |
| `INVALID_USERNAME` | Invalid username for negative tests |
| `INVALID_PASSWORD` | Invalid password for negative tests |

**Hardcoded CI values (not secrets):**

| Variable | CI Value | Reason |
|---|---|---|
| `BROWSER_HEADLESS` | `true` | No display available on Ubuntu runner |
| `BROWSER_SLOW_MO` | `0` | No delay needed in CI |
| `TIMEOUT_DEFAULT` | `120000` | 2 min — accounts for slow CI network |
| `TIMEOUT_LOGIN` | `120000` | 2 min — login can be slow in CI |
| `TIMEOUT_ELEMENT` | `15000` | 15 sec element wait |
| `TIMEOUT_NAVIGATION` | `120000` | 2 min page navigation |

---

#### 7. Run All Tests
```yaml
run: npm test
continue-on-error: true
```
Executes `cucumber-js --profile default` (sequential run). `continue-on-error: true` ensures the workflow continues to generate and publish the Allure report even when tests fail.

---

#### 8. Generate Allure Report
```yaml
run: node_modules/allure-commandline/dist/bin/allure generate allure-results --clean -o allure-report
if: always()
```
Converts raw JSON results from `allure-results/` into a full HTML report in `allure-report/`. Runs `always()` — even if tests fail.

---

#### 9. Upload Allure Results (Artifact)
```yaml
uses: actions/upload-artifact@v4
with:
  name: allure-results
  path: allure-results/
  retention-days: 30
```
Uploads raw Allure JSON result files as a downloadable artifact. Retained for 30 days.

---

#### 10. Upload Allure HTML Report (Artifact)
```yaml
uses: actions/upload-artifact@v4
with:
  name: allure-report
  path: allure-report/
  retention-days: 30
```
Uploads the generated HTML report as a downloadable artifact. Retained for 30 days.

---

#### 11. Publish Allure Report to GitHub Pages
```yaml
uses: peaceiris/actions-gh-pages@v3
if: github.ref == 'refs/heads/main' && always()
with:
  github_token: ${{ secrets.GITHUB_TOKEN }}
  publish_branch: gh-pages
  publish_dir: allure-report
  destination_dir: allure-report
  force_orphan: true
```
Deploys the HTML report to the `gh-pages` branch so it is accessible as a live URL.

- Only runs on `main` branch pushes (not on PRs)
- `force_orphan: true` — replaces the entire `gh-pages` branch on each deploy (no history bloat)
- `destination_dir: allure-report` — report is served at `https://<org>.github.io/<repo>/allure-report/`
- `GITHUB_TOKEN` is automatically provided by GitHub Actions — no manual secret needed

---

## Execution Flow Diagram

```
Trigger (push / PR / schedule / manual)
        │
        ▼
  Checkout Code
        │
        ▼
  Setup Node 18 + Java 17
        │
        ▼
  npm ci  →  Install Playwright Chromium
        │
        ▼
  Create .env from GitHub Secrets
        │
        ▼
  npm test  (cucumber-js --profile default)
  [continue-on-error: true]
        │
        ▼
  Generate Allure HTML Report  [always]
        │
        ├──────────────────────────────┐
        ▼                              ▼
  Upload allure-results        Upload allure-report
  (artifact, 30 days)          (artifact, 30 days)
                                       │
                               [only on main branch]
                                       ▼
                          Publish to GitHub Pages
                          (gh-pages branch)
```

---

## Conditional Execution Summary

| Step | Condition | Reason |
|---|---|---|
| Run tests | always (default) | Core step |
| Generate report | `if: always()` | Must run even on test failure |
| Upload artifacts | `if: always()` | Preserve results regardless of outcome |
| Publish to Pages | `github.ref == 'refs/heads/main' && always()` | Only deploy from main, not PRs |

---

## Artifacts

After each workflow run, two downloadable artifacts are available from the GitHub Actions run page:

| Artifact | Contents | Retention |
|---|---|---|
| `allure-results` | Raw JSON result files from Cucumber | 30 days |
| `allure-report` | Full HTML Allure report (open `index.html`) | 30 days |

---

## GitHub Pages Report URL

Once deployed, the live report is accessible at:

```
https://<your-org>.github.io/<your-repo>/allure-report/
```

The `gh-pages` branch is fully managed by the workflow. Do not push to it manually.

---

## Adding New Secrets

1. Go to **GitHub repo → Settings → Secrets and variables → Actions**
2. Click **New repository secret**
3. Add the secret name and value
4. Reference it in the workflow as `${{ secrets.SECRET_NAME }}`

---

## Local vs CI Environment Differences

| Setting | Local (`.env`) | CI (workflow) |
|---|---|---|
| `BROWSER_HEADLESS` | `false` (see browser) | `true` (no display) |
| `BROWSER_SLOW_MO` | `80` (default) | `0` (no delay) |
| Credentials | From local `.env` file | From GitHub Secrets |
| Report publish | Manual (`npm run report:open`) | Auto to GitHub Pages |
| Test profile | `default` or `parallel` | `default` (sequential) |
