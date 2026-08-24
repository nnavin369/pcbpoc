# =============================================================================
# loanSearch.feature — Loan Search E2E Tests
#
# Tests the loan search widget on the Dashboard page.
# Each scenario tests a different search type and verifies:
#   1. The dropdown label updates to the selected search type
#   2. Results are fetched and displayed in the grid
#   3. The results page contains the searched value
#
# TAGS EXPLAINED:
#   @dashboard → uses the shared logged-in session (no re-login per scenario)
#   @smoke     → core happy-path test — run these for a quick sanity check
#   @loanid    → run only the Loan ID search:  npm run test:loanid
#   @name      → run only the Name search:     npm run test:name
#   @street    → run only the Street search:   cucumber-js --tags @street
#   @city      → run only the City search:     cucumber-js --tags @city
#   @state     → run only the State search:    cucumber-js --tags @state
#   @zipcode   → run only the Zipcode search:  cucumber-js --tags @zipcode
#
# RUN ALL LOAN SEARCH TESTS:
#   npm run test:loansearch
# =============================================================================

@dashboard @loanSearch
Feature: Loan Search on Dashboard
  As a logged-in user
  I want to search loans by each search type
  So that I can confirm data is fetched from the application

  # ── Search by Loan ID ──────────────────────────────────────────────────────
  # Enters a full loan number and verifies the loan appears in results
  @smoke @loanid
  Scenario: Search by Loan ID returns results
    Given I am on the dashboard
    When I select search type "Loan ID" and enter "0"
    Then loan search results should be fetched and displayed
    And the results page should contain "0"

  # ── Search by Name ─────────────────────────────────────────────────────────
  # Searches using first name and last name — uses two separate input fields
  @smoke @name
  Scenario: Search by Name returns results
    Given I am on the dashboard
    When I search by name "Allen" "Cook"
    Then loan search results should be fetched and displayed
    And the results page should contain "Allen"

  # ── Search by Street ───────────────────────────────────────────────────────
  # Partial street name search — returns all loans with "Main" in the street address
  @smoke @street
  Scenario: Search by Street returns results
    Given I am on the dashboard
    When I select search type "Street" and enter "Main"
    Then loan search results should be fetched and displayed
    And the results page should contain "Main"

  # ── Search by City ─────────────────────────────────────────────────────────
  # Searches for all loans in Charlotte, NC
  @smoke @city
  Scenario: Search by City returns results
    Given I am on the dashboard
    When I select search type "City" and enter "Charlotte"
    Then loan search results should be fetched and displayed
    And the results page should contain "Charlotte"

  # ── Search by State ────────────────────────────────────────────────────────
  # Searches using the 2-letter state abbreviation
  @smoke @state
  Scenario: Search by State returns results
    Given I am on the dashboard
    When I select search type "State" and enter "NC"
    Then loan search results should be fetched and displayed
    And the results page should contain "NC"

  # ── Search by Zipcode ──────────────────────────────────────────────────────
  # Searches for all loans in the given zip code area
  @smoke @zipcode
  Scenario: Search by Zipcode returns results
    Given I am on the dashboard
    When I select search type "Zipcode" and enter "666"
    Then loan search results should be fetched and displayed
    And the results page should contain "666"
