# La búsqueda de una tienda entiende palabras sueltas

## Context

### Problem

El buscador del catálogo de una tienda (`/tienda/<handle>`) y el del panel de inventario
(`/cuenta/inventario`) buscan la frase entera, tal como se escribió, dentro del título. Solo ignoran
las mayúsculas. Por eso «masa madre» encuentra «Pan de masa madre de canela», pero «canela masa»,
«madr canel» o «proteina» sin acento no encuentran nada, aunque el producto esté ahí.

Los otros buscadores ya no funcionan así. El selector de productos de la difusión (slice 10 de
`commerce/030`) busca cada palabra suelta, en cualquier orden, a medias y sin acentos, ñ ni
mayúsculas. La búsqueda del sitio (`search/006`) entiende palabras a medias.

### Savings

Quien viene a comprar a una tienda de cientos de productos escribe el nombre como lo recuerda. Hoy,
si no lo escribe en el orden exacto y con acentos, ve «no hay nada» de algo que sí se vende, y la
compra se pierde dentro del catálogo. Quien administra el inventario pierde el mismo tiempo
buscando lo suyo.

### Why

Que todos los buscadores del sitio entiendan lo mismo. Quien aprendió a buscar en uno no tiene que
aprender otra regla en el siguiente.

## Roadmap de slices

### Slice 1 — Palabras sueltas en la tienda y el inventario

- Lo escrito se parte con `searchWords` (el mismo del selector de la difusión): sin acentos, ñ, ü ni
  mayúsculas, sin repetir, hasta 8 palabras.
- El título, en cualquiera de sus idiomas, tiene que **contener todas** las palabras, en cualquier
  orden y aunque sea a medias. Se compara con `sqlFold`, ya probado contra el dominio.
- **Primero los títulos que empiezan con la primera palabra**, y después el orden de siempre de cada
  lista: la tienda por lo más reciente y el inventario alfabético.
- Lo demás no cambia: el pilar, «agotados» y la paginación se combinan igual, y el término viaja en
  la dirección.

Fuera de este slice: el rescate por sentido («algo para dormir» dentro de una tienda). Cuesta una
llamada al proveedor por búsqueda; se decide después si hace falta.

Sin migración: `sqlFold` usa `translate`, que no necesita extensiones.
