Feature: Create Post
  Let a registered user publish a healthy post — recetas, productos, rutinas, retos, remedios caseros, etc.

  As a registered user
  I want to publish a healthy post
  So that the community can discover it and improve their well-being

  Background:
    Given the app is running with PostgreSQL as the database

  Scenario: Anonymous user cannot publish
    Given an unregistered user on the home page
    When this user clicks "Publicar"
    Then the sign-in page should be shown
    And a "Google" sign-in button should be visible

  Scenario: Registered user sees the publish form
    Given a signed-in user
    When this user navigates to "/publicar"
    Then a form should be shown with fields for title, description, price, phone, and media

  Scenario Outline: Registered user publishes a healthy post
    Given a signed-in user on "/publicar"
    When this user fills the form with:
      | title       | <title>       |
      | description | <description> |
      | price       | <price>       |
      | phone       | <phone>       |
      | media       | <media>       |
    And submits the form
    Then the post is saved to PostgreSQL in the posts, post_translations, and post_media tables
    And the user is redirected to "/<slug>"
    And the page shows "<title>" as the heading

    Examples:
      | title                                | description                                                                               | price | phone      | media                                  |
      | Crema de cacahuate artesanal         | Cacahuate orgánico molido, sin azúcar añadida. Ideal para el desayuno o pre-entreno.     | 120   | 2781092116 | ./src/e2e/dummies/post.jpg            |
      | Reto 7 días: camina 5 minutos        | Empieza con solo 5 minutos al día. Progresión guiada. Incluye checklist descargable.      | 0     | 2781092116 | ./src/e2e/dummies/post.jpg            |
      | Ensalada griega con queso feta       | Lechuga, tomate, pepino, aceitunas, cebolla morada y queso feta. Aderezo de limón y AOVE. | 80    | 2781092116 | ./src/e2e/dummies/post.jpg            |
      | Tónico de jengibre y cúrcuma         | Receta casera para reforzar el sistema inmune. Jengibre fresco, cúrcuma, miel y limón.   | 45    | 2781092116 | ./src/e2e/dummies/post.jpg            |
      | Guía: cómo leer etiquetas            | Aprende a identificar azúcares ocultos, grasas trans y aditivos en 10 minutos. PDF incluido. | 25 | 2781092116 | ./src/e2e/dummies/post.jpg            |
