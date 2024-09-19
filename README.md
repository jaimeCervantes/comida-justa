# COMIDA JUSTA. Comida sana, Comunidad & Justicia

> AMA Y CUIDA TU RECURSO MÁXIMO, NO RENOVABLE: TU TIEMPO.

¿Como evitar enfermedades, ahorrar tiempo y dinero, al mismo tiempo que apoyas al medio ambiente y a tu comunidad?

## ¿Por qué poner tu granito de arena?

### COMIDA SANA

Prevención de enfermedades crónica. En México, la transformación de la cultura alimentaria ha llevado a un aumento en problemas de salud pública como la obesidad y la diabetes

### COMUNIDAD

Fomento de hábitos saludables. Crear una comunidad que promueva y apoye la alimentación saludable y los estilos de vida activos.

### JUSTICIA

Promoción de la sostenibilidad y el comercio local. El apoyo a los productores y negocios locales tiene un impacto positivo en la salud, economía local y el medio ambiente.

Estos tres beneficios convergen en ahorrar tiempo y dinero a todo la comunidad.

## Estudios y estadísticas que respaldan esta iniciativa:

### COMIDA SANA. Salud y sus Beneficios Económicos y Personales

En México, la transformación de la cultura alimentaria ha llevado a un aumento en problemas de salud pública como la obesidad y la diabetes, fuente Revista UNAM. Todos juntos podemos educar sobre la importancia de una alimentación saludable para combatir estas enfermedades. Esto no solo mejorará la salud personal, sino que también reducirá los costos en tratamientos médicos y medicamentos, lo que representa un ahorro significativo para las familias. Además, estar más saludable significa tener más energía y menos días de enfermedad, menos citas al doctor y menos organización para combatir el malestar, aumentando la productividad laboral y el tiempo disponible para pasar con la familia. Estos beneficios se ven reflejados en estudios como los realizados en México que muestran cómo los cambios en la dieta y cultura alimentaria afectan la salud pública, fuente Scientific electronic Library Online México.

Un estudio publicado en “Scientific Reports” encontró que las elecciones alimenticias saludables están asociadas con una mayor felicidad al comer, sugiriendo que una dieta saludable tiene beneficios tanto físicos como mentales.

### COMUNIDAD. Impacto Comunitario y Económico

Las comunidades saludables son pilares de sociedades fuertes. Iniciativas como las de Save the Children en México, que incluyen actividades físicas y talleres de alimentación saludable, demuestran cómo la mejora de la nutrición en niños y adolescentes puede reducir a largo plazo los costos médicos a nivel comunitario, fuente: savethechildren, Nutrición infantil en México. Además, estas actividades fortalecen los lazos comunitarios, creando un ambiente de apoyo mutuo, en el que es fácil formar hábitos, a diferencia de hacerlo por cuenta propia. Al fomentar prácticas alimenticias locales y tradicionales, se apoya la economía local y se reduce la dependencia de alimentos importados, contribuyendo así al desarrollo económico de la comunidad y permitiendo que las familias ahorren dinero al comprar alimentos locales y frescos. Fuente, Alimentación y salud, UNAM.

“Young people and healthy eating: a systematic review of research on barriers and facilitators” examina los factores que influyen en los hábitos alimenticios saludables entre los jóvenes, un aspecto crucial para fomentar comunidades saludables.

### JUSTICIA. Justicia Local y Sostenibilidad:

Justicia para las familias, tanto de productores locales como de consumidores y además un trato justo a nuestro planeta. Abordar la justicia local en términos de nutrición implica garantizar el acceso a alimentos nutritivos y asequibles. El “Panorama regional de la seguridad alimentaria y nutricional 2021” resalta la importancia de asegurar la disponibilidad de alimentos saludables, lo que reduce el gasto familiar en alimentos y promueve opciones locales y sostenibles. Fuente Naciones Unidas, México​. Esto no solo ayuda a las familias a ahorrar dinero, sino que también contribuye a un entorno más saludable, reduciendo los costos ambientales y de salud a largo plazo. Al promover la justicia alimentaria, se crea un ciclo de beneficios que incluye la mejora de la salud comunitaria, el fortalecimiento de la economía local y la protección del medio ambiente. Healthy Eating Research destaca la importa.ncia de las comidas escolares saludables y cómo pueden afectar positivamente la nutrición y el rendimiento académico de los estudiantes, lo que tiene implicaciones para el apoyo a la economía local y la sostenibilidad.


# Development

## Playwright test with Google Sigin Provider

Just use page.waitForURL() to get the correct url path, this function waits until the correct url is available. In this case if there is redirects like google sign in, it waits anyway until google sign in url is available.

- http://127.0.0.1:3000
- http://127.0.0.1:3000/api/auth/callback/google


Doing this, avoid the this kind of flaky test:

```bash
1) [chromium] › createPost/createPost.spec.ts:23:9 › Given an unregistered User that opened the app › When this anonymous user wants to publish a healthy food › Then a Google Sigin provider should be presented 

    Error: Timed out 5000ms waiting for expect(locator).toHaveURL(expected)

    Locator: locator(':root')
    Expected string: "http://127.0.0.1:3000/api/auth/signin"
    Received string: "http://127.0.0.1:3000/"
    Call log:
      - expect.toHaveURL with timeout 5000ms
      - waiting for locator(':root')
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"
      -   locator resolved to <html lang="es-MX">…</html>
      -   unexpected value "http://127.0.0.1:3000/"


      27 |       await btnPublish.click({ button: "left" });
      28 |
    > 29 |       await expect(page).toHaveURL(SIGNIN_PATH);
         |                          ^
      30 |
      31 |       const googleBtn = page.getByRole("button", { name: /google/i });
      32 |

        at /__w/comida-justa/comida-justa/src/e2e/createPost/createPost.spec.ts:29:26

  1 flaky
    [chromium] › createPost/createPost.spec.ts:23:9 › Given an unregistered User that opened the app › When this anonymous user wants to publish a healthy food › Then a Google Sigin provider should be presented 
  3 skipped
  5 passed (30.6s)
```
## TODO

[] Crear componente UI de error con icono de error, tal vez llamado ErrorMessage
