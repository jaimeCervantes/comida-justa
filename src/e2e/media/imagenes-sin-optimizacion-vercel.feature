Feature: Imágenes remotas sin optimización de Vercel

  Context:
  - Problem: Vercel devuelve `402 Payment Required` desde `/_next/image` para imágenes remotas que
    el sitio intenta optimizar.
  - Savings: las imágenes públicas vuelven a mostrarse sin consumir Image Optimization de Vercel.
  - Why: la disponibilidad de imágenes en producción es más importante que la optimización automática
    mientras el sitio no tenga billing/cupo suficiente para ese pipeline.

  As a visitor
  I want remote images to load directly from their storage host
  So that product and content images do not disappear when Vercel Image Optimization is blocked

  @slice-1
  Scenario: A remote post image is not rewritten through `/_next/image`
    Given the site renders a remote image from Firebase Storage
    When a visitor opens the page
    Then the rendered image keeps the Firebase Storage URL as its `src`
    And the rendered image `src` does not start with `/_next/image`
