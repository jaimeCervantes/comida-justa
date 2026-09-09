Feature: El acceso de escritorio no rompe el chrome

  Context:
  - Problem: en escritorio, `/auth/signin?callbackUrl=%2F` muestra el header público cortado y el
    contenido de acceso encimado: la imagen invade el texto y los botones de proveedor.
  - Savings: se evita que una persona abandone o desconfíe justo antes de publicar, comentar o
    participar en la comunidad.
  - Why: la pantalla de acceso es la puerta de participación; si se ve rota, el sitio parece roto
    antes de que la autenticación haga su trabajo.

  As a visitor on desktop
  I want the sign-in page and public header to fit the viewport
  So that I can choose a provider without fighting the layout

  @slice-1
  Scenario: El header y el acceso caben en escritorio
    Given una ventana desktop de 1536 x 900
    When abro "/auth/signin?callbackUrl=%2F"
    Then el documento no tiene desborde horizontal
    And el header cabe completo dentro de la ventana
    And las acciones principales del header siguen visibles como iconos con nombre accesible
    And el panel de acceso queda debajo del header y dentro de la ventana
    And la imagen de acceso no cubre el mensaje ni los botones
    And los proveedores "Iniciar sesión con Google" e "Iniciar sesión con Microsoft" están visibles
    And el texto legal queda después de los proveedores
