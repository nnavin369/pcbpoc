# =============================================================================
# login.feature — User Authentication Tests
#
# Tests the login page of the Shellpoint Insight Portal.
# Covers valid login, invalid credentials, and empty credentials.
#
# TAGS EXPLAINED:
#   @login    → each scenario gets a FRESH isolated browser (no shared session)
#   @smoke    → happy-path test — valid login should always pass
#   @negative → tests that expect failure (wrong/empty credentials)
#
# RUN COMMANDS:
#   npm run test:login     → run all login scenarios
#   npm run test:smoke     → run only @smoke (valid login)
#   npm run test:negative  → run only @negative (invalid + empty credentials)
# =============================================================================

@login
Feature: User Authentication
  As a user of Shellpoint Mortgage Servicing
  I want to log in to the Insight application
  So that I can access the portal

  # Background runs before EACH scenario in this feature
  # Navigates to the login page so every test starts fresh
  Background:
    Given I am on the login page

  # ── Valid Login ────────────────────────────────────────────────────────────
  # Happy path — correct credentials should redirect to the dashboard
  # Credentials are loaded from the .env file — not hardcoded here
  @smoke
  Scenario: Successful login with valid credentials
    When I login with valid credentials
    Then I should be redirected to the dashboard

  # ── Invalid Credentials ────────────────────────────────────────────────────
  # Negative test — wrong username/password should show an error message
  # Credentials are loaded from the .env file — not hardcoded here
  @negative
  Scenario: Login fails with invalid credentials
    When I login with invalid credentials
    And I click the login button
    Then I should see an error message "Invalid username or password"

  # ── Empty Credentials ──────────────────────────────────────────────────────
  # Negative test — clicking login without entering anything should show validation error
  @negative
  Scenario: Login fails with empty credentials
    When I click the login button
    Then I should see an error message "The User name field is required"
