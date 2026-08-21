@api @loanSearchApi
Feature: Loan Search API Response Validation
  As a QA Automation Engineer
  I want to verify the backend API response status code and response payload
  when searching for Loan ID 555835905 in the Insight application

  @smoke @apiValidation
  Scenario: Verify API response status and payload for Loan ID 555835905
    Given I am on the dashboard
    When I search for Loan ID "555835905" with API response capture
    Then the API response status code should be 200
    And the API response payload should match the expected fields:
      | Field / Property     | Expected Value | Condition |
      | Loan ID              | 555835905      | equals    |
      | Endpoint             | /Loans/Loan    | contains  |
      | HTTP Status          | 200            | equals    |
      | Response Body        | NOT_EMPTY      | exists    |
