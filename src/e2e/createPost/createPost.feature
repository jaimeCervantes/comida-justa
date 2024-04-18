Feature: Create Post
Let users create a new post of healthy food

As an registered user
I want to create a new post
So that I can sell healthy food

Scenario: Anonymous User trying to publish a post
  Given a unregistered User that opened the app
  When this anonymous user wants to publish a healthy food
  Then a register/login form should be shown

Scenario: Registed User
  Given a Registered User that opened the app
  When this user wants to create a new post
  Then a form to create a new post should be shown

Scenario: Register a new user
  Given a register form
  When an user enters a name
  And enters lastNames
  And enters an email
  And enters a password
  And repeats the password
  And send this information
  Then a succesful screen should be shown

Scenario: Login
  Given a login form
  And enters an email
  And enters a password
  And repeats the password
  And send this information
  Then a succesful screen should be shown

Scenario: Create Post using a Form
  Given a registered user
  When this user wants to create a post of healthy food
  Then a Post form should be shown
  When this user enters the title
  And enters description
  And enters price
  And enters images about the food
  And send this information to save
  Then a succesful screen should be shown
