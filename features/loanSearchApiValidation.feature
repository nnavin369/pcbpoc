@api @loanSearchApi
Feature: Loan Search API Response Validation
  As a QA Automation Engineer
  I want to verify the backend API response status code and JSON response fields
  when searching for Loan ID 555835905 in the Insight application,
  including verifying that Address contains "110 Main Street" and printing the full payload.

  @smoke @apiValidation
  Scenario: Verify API response status, Address field, and print payload for Loan ID 555835905
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
    And the API response from "/DataApi/Info/InfoById/" should match the following JSON fields:
      | JSON Field | Expected Value  | Condition |
      | Address    | 110 Main Street | contains  |
      | City       | Waltham         | equals    |
      | State      | MA              | equals    |
      | Status     | Active          | equals    |
    Then I print the API response for "/DataApi/Info/InfoById/"
