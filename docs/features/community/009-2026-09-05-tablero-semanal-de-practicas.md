# Tablero semanal de practicas

> Roadmap de slices. Escenarios: `src/e2e/habits/tableroSemanalDePracticas.feature`.
> Este documento convierte la recomendacion de
> `docs/features/community/008-2026-09-05-la-red-social-de-las-practicas.md` en trabajo entregable.

## Alineacion

**Problem.** La gamificacion actual existe, pero esta repartida: los retos viven en los pilares, las
practicas en `/practicas`, las practicas elegidas en `/habitos`, y el jardin social se lee mas como
un dato que como una accion diaria. Quien vuelve a practicar no ve de inmediato que hacer hoy ni
cuanto avance semanal lleva.

**Savings.** Se reduce la friccion diaria: menos navegacion, menos duda sobre que falta, menos
riesgo de empujar una competencia de salud con campeones semanales, y mas claridad para volver
despues de faltar.

**Why.** Hazlo Sano quiere construir habitos sostenibles alrededor de los cuatro pilares y una
comunidad local. El modelo correcto es "practico y aporto al jardin", no "gano contra otros".

## Modelo acordado

- Retos activos, si; campeones semanales, no.
- El avance de cada usuario en la semana debe ser muy visible.
- El jardin se mantiene como progreso colectivo: aportes y semanas sostenidas, sin podio ni premio.
- Las practicas del catalogo siguen alimentando el mismo conteo por pilar y dia.

## Slices

### Slice 1 - Tablero semanal visible en `/habitos`

**Alcance.**

- Arriba de `/habitos`, una seccion de avance propio semanal.
- La seccion muestra cuantos pilares cuentan hoy: `X de 4`.
- La seccion muestra los cuatro pilares con su progreso semanal actual y si ya cuentan hoy.
- `Mis practicas` deja de ser solo una lista recordatoria: cada practica activa muestra pilar,
  ancla, minimo, estado de hoy y boton para marcarla como hecha.
- Marcar una practica desde `/habitos` escribe el mismo dia de practica que `/practicas`, sin sumar
  mas de una vez por pilar y dia.
- No hay migracion ni tabla nueva.

**Criterios de aceptacion.**

1. Una persona con una practica activa entra a `/habitos` y ve su avance semanal antes de la lista de
   tarjetas de retos.
2. Si ya practico un pilar hoy, ese pilar aparece como contado y su practica no ofrece otro boton
   que prometa sumar de nuevo.
3. Si una practica activa todavia no cuenta hoy, puede marcarla desde `/habitos`.
4. La accion reutiliza el conteo por pilar y dia: marcar dos practicas del mismo pilar no compra dos
   aportes.
5. El jardin y la tabla de aportes no introducen campeones, puestos ni premios.

### Slice 2 - Control de compartir practicas

**Alcance.** Abrir la bandera `user_practices.sharing_enabled` desde `/habitos` para que cada
persona decida que practicas quedan listas para aparecer en su perfil publico.

**Criterios de aceptacion.**

- Una practica activa puede compartirse o retirarse sin dejar de practicarse.
- La decision nace en privado y se puede revertir.
- La accion no acepta identidad desde el formulario; usa la sesion actual.
- Una practica dejada no queda disponible para perfil publico aunque su fila historica exista.

### Slice 3 - El perfil practica

**Alcance.** `/u/[username]` muestra las practicas activas que esa persona decidio compartir,
agrupadas por pilar, con ancla, minimo y fecha de inicio.

**Criterios de aceptacion.**

- Solo aparecen practicas activas con `sharing_enabled`.
- Una practica privada no aparece aunque la persona la lleve.
- Cada practica se agrupa por su pilar primario.
- La tarjeta publica muestra titulo, ancla, minimo y desde cuando se practica.
- El perfil no muestra puntos, ranking ni comparacion personal.

### Slice 4 - Nombres como puertas

**Alcance provisional.** Los alias que ya aparecen en celebraciones y aportes al jardin enlazan al
perfil publico cuando existe.

**Criterios provisionales.**

- El descubrimiento de personas parte de actividad real, no de un directorio vacio.
- Si la persona no tiene perfil publico enlazable, no se inventa destino.

### Slice 5 - Pulso discreto en el inicio

**Alcance provisional.** El inicio muestra una sola linea de descubrimiento hacia la parte de
practica, por ejemplo cuantas personas practicaron esta semana, sin duplicar el jardin completo.

**Criterios provisionales.**

- El inicio sigue centrado en publicaciones, productos y economia local.
- El pulso enlaza al hub de pilares o habitos.

## Fuera de alcance

- Campeones semanales, coronas, trofeos, premios o rankings personales.
- Directorio de miembros antes de que haya perfiles con practicas compartidas.
- Busqueda de personas antes de validar que el directorio haga falta.
- Migraciones de base de datos.
