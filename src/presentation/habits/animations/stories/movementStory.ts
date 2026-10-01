import type { PillarStory } from "./pillarStory";

const MOVEMENT_LOOK = {
  accentInk: "var(--color-pillar-movement-ink)",
  accentSoft: "var(--color-pillar-movement-soft)",
} as const;

/**
 * La animación de Movimiento, bajo el héroe de `/pilares/movimiento` (≈ 2 min).
 *
 * Cuenta lo que la página ya dice —la Revolución Industrial, el costo oculto de mover dos cuadras
 * en motor, el territorio como espacio de movimiento, el pie y el terreno, y las dos anclas de su
 * práctica— sin ningún dato nuevo. El guion completo está en
 * `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares.md`.
 *
 * **Cada duración sale de la narración**, con la misma regla que las demás (ver `sleepStory.ts`).
 * Su voz es la de Gemini 2.5 Flash TTS (ver `scripts/animations/generate-narration.mjs`). Las
 * ilustraciones las genera `scripts/animations/pillar-movement.manifest.json`.
 */
export const MOVEMENT_STORY: PillarStory = {
  pillar: "movement",
  animationId: "pillar-movement",
  slug: "movimiento",
  script: [
    { id: "before", pillar: "movement", beatDurationsMs: [10750, 7750] },
    { id: "change", pillar: "movement", beatDurationsMs: [11250, 9000] },
    { id: "cost", pillar: "movement", beatDurationsMs: [9000, 10250, 8250] },
    {
      id: "counterweight",
      pillar: "movement",
      beatDurationsMs: [11000, 7750, 8000],
    },
    {
      id: "practice",
      pillar: "movement",
      beatDurationsMs: [10000, 8250, 7250],
    },
  ],
  scenes: {
    before: {
      beats: [
        {
          art: "movement-before-1",
          camera: {
            origin: { x: 40, y: 55 },
            from: { scale: 1.1, x: 2 },
            to: { scale: 1.1, x: -2 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 85, y: 35 },
              radius: 200,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 50, y: 20, width: 45, height: 40 },
              count: 10,
            },
          ],
        },
        {
          art: "movement-before-2",
          camera: {
            origin: { x: 55, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 5 },
              radius: 300,
              color: "#fef3c7",
            },
            {
              kind: "motes",
              area: { x: 30, y: 40, width: 50, height: 40 },
              count: 12,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    change: {
      beats: [
        {
          art: "movement-change-1",
          camera: {
            origin: { x: 55, y: 60 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 15, y: 16 },
              radius: 120,
              color: "#e0f2fe",
            },
            {
              kind: "glow",
              at: { x: 50, y: 16 },
              radius: 120,
              color: "#e0f2fe",
            },
            {
              kind: "glow",
              at: { x: 85, y: 16 },
              radius: 120,
              color: "#e0f2fe",
            },
            {
              kind: "glow",
              at: { x: 58, y: 62 },
              radius: 60,
              color: "#93c5fd",
            },
          ],
        },
        {
          art: "movement-change-2",
          camera: {
            origin: { x: 45, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 80, y: 35 },
              radius: 150,
              color: "#fef3c7",
            },
          ],
        },
      ],
    },
    cost: {
      beats: [
        {
          art: "movement-cost-1",
          camera: {
            origin: { x: 55, y: 55 },
            from: { scale: 1.1, x: -1.5 },
            to: { scale: 1.1, x: 1.5 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 60, y: 40 },
              radius: 200,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "movement-cost-2",
          camera: {
            origin: { x: 50, y: 60 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            { kind: "steam", at: { x: 20, y: 78 } },
            { kind: "steam", at: { x: 80, y: 82 } },
            {
              kind: "glow",
              at: { x: 50, y: 20 },
              radius: 300,
              color: "#d6d3d1",
            },
          ],
        },
        {
          art: "movement-cost-3",
          camera: {
            origin: { x: 45, y: 60 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 46, y: 70 },
              radius: 50,
              color: "#fb923c",
            },
            {
              kind: "glow",
              at: { x: 30, y: 88 },
              radius: 120,
              color: "#fdba74",
            },
            {
              kind: "glow",
              at: { x: 80, y: 30 },
              radius: 140,
              color: "#fed7aa",
            },
          ],
        },
      ],
    },
    counterweight: {
      beats: [
        {
          art: "movement-counterweight-1",
          camera: {
            origin: { x: 50, y: 60 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 60, y: 5 },
              radius: 250,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 30, y: 30, width: 50, height: 40 },
              count: 10,
            },
          ],
        },
        {
          art: "movement-counterweight-2",
          camera: {
            origin: { x: 50, y: 55 },
            from: { scale: 1.1, x: 2 },
            to: { scale: 1.1, x: -2 },
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
              area: { x: 0, y: 40, width: 100, height: 30 },
              count: 10,
            },
          ],
        },
        {
          art: "movement-counterweight-3",
          camera: {
            origin: { x: 50, y: 70 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "motes",
              area: { x: 50, y: 70, width: 45, height: 20 },
              count: 12,
              color: "#ffffff",
            },
            {
              kind: "glow",
              at: { x: 80, y: 20 },
              radius: 250,
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
          art: "movement-practice-1",
          camera: {
            origin: { x: 45, y: 60 },
            from: { scale: 1.04 },
            to: { scale: 1.1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 5, y: 40 },
              radius: 250,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "movement-practice-2",
          /* Acercada y baja: la ilustración trae una franja lisa arriba que así queda fuera. */
          camera: {
            origin: { x: 60, y: 95 },
            from: { scale: 1.26 },
            to: { scale: 1.2 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 20, y: 30 },
              radius: 150,
              color: "#fef3c7",
            },
          ],
        },
        {
          art: "movement-practice-3",
          camera: {
            origin: { x: 45, y: 60 },
            from: { scale: 1.1 },
            to: { scale: 1.02 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 40, y: 5 },
              radius: 300,
              color: "#fdba74",
            },
            {
              kind: "motes",
              area: { x: 20, y: 20, width: 60, height: 40 },
              count: 10,
            },
          ],
        },
      ],
    },
  },
  captionKeys: {
    before: ["movement.before.b1", "movement.before.b2"],
    change: ["movement.change.b1", "movement.change.b2"],
    cost: ["movement.cost.b1", "movement.cost.b2", "movement.cost.b3"],
    counterweight: [
      "movement.counterweight.b1",
      "movement.counterweight.b2",
      "movement.counterweight.b3",
    ],
    practice: [
      "movement.practice.b1",
      "movement.practice.b2",
      "movement.practice.b3",
    ],
  },
  chipKeys: {
    before: "movement.before.chip",
    change: "movement.change.chip",
    cost: "movement.cost.chip",
    counterweight: "movement.counterweight.chip",
    practice: "movement.practice.chip",
  },
  regionLabelKey: "movement.regionLabel",
  looks: {
    before: { ...MOVEMENT_LOOK, glow: ["#22c55e", "#facc15", "#0ea5e9"] },
    change: { ...MOVEMENT_LOOK, glow: ["#94a3b8", "#0ea5e9", "#475569"] },
    cost: { ...MOVEMENT_LOOK, glow: ["#a8a29e", "#f97316", "#64748b"] },
    counterweight: {
      ...MOVEMENT_LOOK,
      glow: ["#22c55e", "#0ea5e9", "#facc15"],
    },
    practice: { ...MOVEMENT_LOOK, glow: ["#22c55e", "#fb923c", "#facc15"] },
  },
  videoAccent: "#4ade80",
  soundtrackBase: "/animations/pilares/sonido-movimiento",
};
