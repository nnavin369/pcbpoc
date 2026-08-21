@api @loanSearchApi
Feature: Loan Search API Response Validation
  As a QA Automation Engineer
  I want to verify the backend API response status code and JSON response fields
  when searching for Loan ID 555835905 in the Insight application,
  including Address, InvestorId, and Borrower 1 & Borrower 2 values,
  and print the full response payload.

  @smoke @apiValidation
  Scenario: Verify API response status, Address, InvestorId, Borrower 1 & 2 details, and print payload
    Given I am on the dashboard
    When I search for Loan ID "555835905" with API response capture
    Then the API response status code should be 200
    And the API response payload should match the expected fields:
      | Field / Property     | Expected Value | Condition |
      | Loan ID              | 555835905      | equals    |
      | Endpoint             | /Loans/Loan    | contains  |
      | HTTP Status          | 200            | equals    |
      | Response Body        | NOT_EMPTY      | exists    |
    And the API response field "Address" from "/DataApi/Info/InfoById/" should contain "110 Main Street"
    And the API response field "InvestorId" from "/DataApi/Info/InfoById/" should equal "BAC066"
    And the API response from "/DataApi/Info/InfoById/" should match the following JSON fields:
      | JSON Field                    | Expected Value  | Condition |
      | Address                       | 110 Main Street | contains  |
      | City                          | Waltham         | equals    |
      | State                         | MA              | equals    |
      | Status                        | Active          | equals    |
      | InvestorId                    | BAC066          | equals    |
      | Borrowers[0].FirstName        | Thomas R        | equals    |
      | Borrowers[0].LastName         | Keene           | equals    |
      | Borrowers[0].HomePhoneNumber  | (781) 893-0717  | equals    |
      | Borrowers[1].FirstName        | MARIANNE        | contains  |
      | Borrowers[1].LastName         | KEENE           | contains  |
    Then I print the API response for "/DataApi/Info/InfoById/"
