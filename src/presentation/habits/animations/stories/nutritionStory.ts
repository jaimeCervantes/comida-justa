import type { PillarStory } from "./pillarStory";

const NUTRITION_LOOK = {
  accentInk: "var(--color-pillar-nutrition-ink)",
  accentSoft: "var(--color-pillar-nutrition-soft)",
} as const;

/**
 * La animación de Alimentación, bajo el héroe de `/pilares/alimentacion` (≈ 2 min).
 *
 * Cuenta lo que la página ya dice —la cadena global de la posguerra, el costo oculto del traslado,
 * la temporada y la cercanía, la cocción limpia y las dos anclas de su práctica— sin ningún dato
 * nuevo. El guion completo está en `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares.md`.
 *
 * **Cada duración sale de la narración**, con la misma regla que las demás (ver `sleepStory.ts`).
 * Las ilustraciones las genera `scripts/animations/pillar-nutrition.manifest.json`.
 */
export const NUTRITION_STORY: PillarStory = {
  pillar: "nutrition",
  animationId: "pillar-nutrition",
  slug: "alimentacion",
  script: [
    { id: "before", pillar: "nutrition", beatDurationsMs: [10000, 5250] },
    { id: "change", pillar: "nutrition", beatDurationsMs: [11500, 7750] },
    {
      id: "cost",
      pillar: "nutrition",
      beatDurationsMs: [9750, 7500, 8750],
    },
    {
      id: "counterweight",
      pillar: "nutrition",
      beatDurationsMs: [9750, 5750, 10500],
    },
    {
      id: "practice",
      pillar: "nutrition",
      beatDurationsMs: [8000, 11750, 4750],
    },
  ],
  scenes: {
    before: {
      beats: [
        {
          art: "nutrition-before-1",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 10 },
              radius: 250,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 30, y: 15, width: 50, height: 45 },
              count: 14,
            },
          ],
        },
        {
          art: "nutrition-before-2",
          camera: {
            origin: { x: 45, y: 55 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 20, y: 80 },
              radius: 140,
              color: "#fb923c",
            },
            { kind: "embers", at: { x: 20, y: 83 }, count: 10 },
            { kind: "steam", at: { x: 27, y: 60 } },
            {
              kind: "glow",
              at: { x: 62, y: 30 },
              radius: 150,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    change: {
      beats: [
        {
          art: "nutrition-change-1",
          camera: {
            origin: { x: 50, y: 50 },
            from: { scale: 1.1, x: 2 },
            to: { scale: 1.1, x: -2 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 25 },
              radius: 220,
              color: "#fde68a",
            },
            { kind: "steam", at: { x: 21, y: 8 } },
          ],
        },
        {
          art: "nutrition-change-2",
          camera: {
            origin: { x: 35, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.13 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 45, y: 40 },
              radius: 90,
              color: "#f0abfc",
            },
            {
              kind: "glow",
              at: { x: 50, y: 8 },
              radius: 300,
              color: "#e0f2fe",
            },
          ],
        },
      ],
    },
    cost: {
      beats: [
        {
          art: "nutrition-cost-1",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.12, x: -2 },
            to: { scale: 1.05, x: 1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 65, y: 30 },
              radius: 60,
              color: "#fecaca",
            },
          ],
        },
        {
          art: "nutrition-cost-2",
          camera: {
            origin: { x: 40, y: 60 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 25, y: 20 },
              radius: 200,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "nutrition-cost-3",
          /* Acercada y baja: la ilustración trae una franja lisa arriba que así queda fuera. */
          camera: {
            origin: { x: 50, y: 90 },
            from: { scale: 1.22 },
            to: { scale: 1.17 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 30 },
              radius: 250,
              color: "#bfdbfe",
            },
            { kind: "steam", at: { x: 57, y: 42 } },
          ],
        },
      ],
    },
    counterweight: {
      beats: [
        {
          art: "nutrition-counterweight-1",
          camera: {
            origin: { x: 40, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 25, y: 12 },
              radius: 200,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 10, y: 5, width: 40, height: 30 },
              count: 10,
            },
          ],
        },
        {
          art: "nutrition-counterweight-2",
          camera: {
            origin: { x: 55, y: 50 },
            from: { scale: 1.1, x: -1.5 },
            to: { scale: 1.1, x: 1.5 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 48, y: 52 },
              radius: 80,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 85, y: 32 },
              radius: 120,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 30, y: 35, width: 55, height: 30 },
              count: 12,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "nutrition-counterweight-3",
          camera: {
            origin: { x: 60, y: 50 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            { kind: "steam", at: { x: 55, y: 60 } },
            {
              kind: "glow",
              at: { x: 57, y: 88 },
              radius: 60,
              color: "#60a5fa",
            },
            {
              kind: "glow",
              at: { x: 85, y: 25 },
              radius: 200,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    practice: {
      logo: "closing",
      beats: [
        {
          art: "nutrition-practice-1",
          camera: {
            origin: { x: 50, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 15, y: 38 },
              radius: 150,
              color: "#fdba74",
            },
            {
              kind: "motes",
              area: { x: 5, y: 25, width: 40, height: 40 },
              count: 12,
            },
          ],
        },
        {
          art: "nutrition-practice-2",
          camera: {
            origin: { x: 50, y: 65 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 45, y: 70 },
              radius: 200,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "nutrition-practice-3",
          camera: {
            origin: { x: 45, y: 60 },
            from: { scale: 1.1 },
            to: { scale: 1.02 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 15, y: 55 },
              radius: 250,
              color: "#fdba74",
            },
            {
              kind: "glow",
              at: { x: 80, y: 55 },
              radius: 100,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
  },
  captionKeys: {
    before: ["nutrition.before.b1", "nutrition.before.b2"],
    change: ["nutrition.change.b1", "nutrition.change.b2"],
    cost: ["nutrition.cost.b1", "nutrition.cost.b2", "nutrition.cost.b3"],
    counterweight: [
      "nutrition.counterweight.b1",
      "nutrition.counterweight.b2",
      "nutrition.counterweight.b3",
    ],
    practice: [
      "nutrition.practice.b1",
      "nutrition.practice.b2",
      "nutrition.practice.b3",
    ],
  },
  chipKeys: {
    before: "nutrition.before.chip",
    change: "nutrition.change.chip",
    cost: "nutrition.cost.chip",
    counterweight: "nutrition.counterweight.chip",
    practice: "nutrition.practice.chip",
  },
  regionLabelKey: "nutrition.regionLabel",
  looks: {
    before: { ...NUTRITION_LOOK, glow: ["#f97316", "#84cc16", "#facc15"] },
    change: { ...NUTRITION_LOOK, glow: ["#94a3b8", "#f97316", "#475569"] },
    cost: { ...NUTRITION_LOOK, glow: ["#60a5fa", "#94a3b8", "#f97316"] },
    counterweight: {
      ...NUTRITION_LOOK,
      glow: ["#f97316", "#84cc16", "#facc15"],
    },
    practice: { ...NUTRITION_LOOK, glow: ["#fb923c", "#f472b6", "#84cc16"] },
  },
  videoAccent: "#fb923c",
  soundtrackBase: "/animations/pilares/sonido-alimentacion",
};
