import type { CategoryTaxonomySnapshot } from "./taxonomy";

/**
 * Instantánea de emergencia del catálogo, para cuando la base no puede responder.
 *
 * Sin esto, una tabla de 14 filas sería capaz de tumbar la portada, y el sitio no podría
 * desplegarse antes de que la migración corriera. Se usa **solo** en modo degradado: el
 * repositorio la devuelve ante un error de consulta o cero filas, y avisa por consola.
 *
 * Es una copia deliberada del seed de `0026_2026-07-28_centralize_catalog_taxonomy.py`. Puede
 * quedar desfasada, y está bien: si la base responde, esto no se lee. Lo que **no** debe pasar es
 * que se convierta en la fuente de verdad — para eso está el aviso.
 *
 * No incluye alias: solo sirven a la búsqueda por texto, que vive en SQL
 * (`category_keys_matching`) y que sin base tampoco funcionaría. Lo que sí tiene que seguir
 * funcionando sin base es pintar etiquetas, llenar el selector de `/publicar` y validar al
 * publicar, y para eso bastan las claves y sus traducciones.
 */
export const FALLBACK_CATEGORY_TAXONOMY: CategoryTaxonomySnapshot = {
  nodes: [
    {
      key: "alimentacion",
      parentKey: null,
      level: 1,
      isActive: true,
      sortOrder: 10,
      labels: { es: "Alimentación", en: "Food" },
    },
    {
      key: "jugos",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 10,
      labels: { es: "Jugos", en: "Juices" },
    },
    {
      key: "platillos",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 20,
      labels: { es: "Platillos", en: "Dishes" },
    },
    {
      key: "bebidas",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 30,
      labels: { es: "Bebidas", en: "Drinks" },
    },
    {
      key: "panaderia",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 40,
      labels: { es: "Panadería", en: "Bakery" },
    },
    {
      key: "abarrotes",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 50,
      labels: { es: "Abarrotes", en: "Groceries" },
    },
    {
      key: "untables",
      parentKey: "alimentacion",
      level: 2,
      isActive: true,
      sortOrder: 60,
      labels: { es: "Untables", en: "Spreads" },
    },
  ],
  aliases: [],
};
