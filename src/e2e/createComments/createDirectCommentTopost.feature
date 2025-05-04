Feature: Write comments on healthy post posts
  As an authenticated user
  I want to write, edit, and delete comments on a healthy post post
  To share my opinion with other users

  Scenario: Write a comment on a post
    Given the user is authenticated and viewing a post
    When they write a comment in the comment field
    Then the comment should appear below the post with the user's name and the date.

  Scenario: Validation of empty fields
    Given the user is authenticated and viewing a post
    When they attempt to submit a comment with no text
    Then it should show an error message indicating that the comment cannot be empty.

  Scenario: Maximum comment length
    Given the user is authenticated
    When they try to write a comment that exceeds 500 characters
    Then it should show an error message indicating that the comment cannot exceed 500 characters.

  Scenario: View comments from other users
    Given the user is authenticated and viewing a post
    When other users have commented on the post
    Then they should be able to see the comments sorted by date, from newest to oldest.

  Scenario: Success notification upon commenting
    Given the user has written a comment
    When the comment is submitted successfully
    Then the user should receive a notification confirming that their comment has been posted.
