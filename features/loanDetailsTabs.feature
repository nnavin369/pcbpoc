# =============================================================================
# loanDetailsTabs.feature — Multi-Tab Loan Details Verification Tests
#
# Searches for Loan ID 555835905 and sequentially verifies all 14 tabs.
# Each tab row includes comma-separated "Expected Text" keywords that must
# appear on the tab's content panel. To add more verifications in the future,
# simply add more keywords or new tab rows.
#
# TAGS:
#   @dashboard → uses shared logged-in session
#   @loanTabs  → target tag for loan tabs verification suite
# =============================================================================

@dashboard @loanTabs
Feature: Loan Details Multi-Tab Verification
  As a mortgage servicing analyst
  I want to search for a specific Loan ID and navigate through all tabs
  So that I can verify data is correctly populated across all tab panels

  Scenario: Verify all 14 loan detail tabs for Loan ID 555835905
    Given I am on the dashboard
    When I select search type "Loan ID" and enter "555835905"
    Then loan search results should be fetched and displayed
    And I click on loan ID "555835905" in search results
    Then I verify the following loan detail tabs and expected content:
      | Tab Name            | Expected Text                                     | Expected API Endpoint   |
      | Info                | Loan; Borrower; Servicer                           | /Loans/Loan             |
      | Balances            | Principal; Escrow; Balance                         | /DataApi/Balances       |
      | Property            | Property; Address                                  | /DataApi/Property       |
      | History             | History                                            | /DataApi/History        |
      | Comments            | Commments                                           | /DataApi/Comments       |
      | Documents           | Documents                                          | /Loans/Loan             |
      | Loss Mitigation     | Loss Mitigation                                    | /DataApi/LossMitigation |
      | Foreclosure         | Foreclosure                                        | /DataApi/Foreclosure    |
      | Bankruptcy          | Bankruptcy                                         | /DataApi/Bankruptcy     |
      | Delegated Authority | Delegated Authority                                | /DataApi/DelegatedAuth  |
      | Taxes and Insurance | Taxes; Insurance                                   | /DataApi/Tax            |
      | Flood Occupancy     | Flood; Occupancy                                   | /DataApi/FloodOccupancy  |
      | Payoff Quote        | Payyoff                                             | /Loans/Loan             |
      | Cut off Dates       | Cut; Dates                                         | /DataApi/Cutoffs        |
