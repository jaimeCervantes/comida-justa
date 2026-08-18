import { describe, expect, it } from "vitest";
import {
  categoryKeyForPublicationPillar,
  categoryKeysForPublicationPillar,
  PUBLICATION_PILLARS,
  parsePublicationPillar,
} from "./publicationPillars";
import { createCategoryTaxonomy } from "./taxonomy";

const taxonomy = createCategoryTaxonomy({
  nodes: [
    {
      key: "sueno_y_descanso",
      parentKey: null,
      level: 1,
      isActive: true,
      sortOrder: 10,
      labels: { es: "Sueño y descanso", en: "Sleep and rest" },
    },
    {
      key: "rituales_de_sueno",
      parentKey: "sueno_y_descanso",
      level: 2,
      isActive: true,
      sortOrder: 10,
      labels: { es: "Rituales de sueño", en: "Sleep rituals" },
    },
    {
      key: "alimentacion",
      parentKey: null,
      level: 1,
      isActive: true,
      sortOrder: 20,
      labels: { es: "Alimentación", en: "Nutrition" },
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
      key: "movimiento_y_ejercicio",
      parentKey: null,
      level: 1,
      isActive: false,
      sortOrder: 30,
      labels: { es: "Movimiento", en: "Movement" },
    },
  ],
  aliases: [],
});

describe("publication pillars", () => {
  it("declara los cuatro pilares en el orden que ve la interfaz", () => {
    expect(PUBLICATION_PILLARS.map((pillar) => pillar.key)).toEqual([
      "sleep",
      "nutrition",
      "movement",
      "mindSpirit",
    ]);
  });

  it.each([
    ["sleep", "sueno_y_descanso"],
    ["nutrition", "alimentacion"],
    ["movement", "movimiento_y_ejercicio"],
    ["mindSpirit", "mente_y_espiritu"],
  ] as const)("mapea %s a su raiz de taxonomia", (pillar, categoryKey) => {
    expect(categoryKeyForPublicationPillar(pillar)).toBe(categoryKey);
  });

  it("resuelve el subarbol activo de un pilar", () => {
    expect(categoryKeysForPublicationPillar(taxonomy, "sleep")).toEqual([
      "sueno_y_descanso",
      "rituales_de_sueno",
    ]);
  });

  it("devuelve una lista vacia si la raiz del pilar no existe o esta inactiva", () => {
    expect(categoryKeysForPublicationPillar(taxonomy, "movement")).toEqual([]);
    expect(categoryKeysForPublicationPillar(taxonomy, "mindSpirit")).toEqual(
      [],
    );
  });

  it.each([
    ["sleep", "sleep"],
    ["nutrition", "nutrition"],
    ["movement", "movement"],
    ["mindSpirit", "mindSpirit"],
    ["mind", null],
    ["", null],
    [undefined, null],
  ] as const)("parsea el parametro %j como %j", (raw, expected) => {
    expect(parsePublicationPillar(raw)).toBe(expected);
  });
});
