import type { PillarStory } from "./pillarStory";

const SLEEP_LOOK = {
  accentInk: "var(--color-pillar-sleep-ink)",
  accentSoft: "var(--color-pillar-sleep-soft)",
} as const;

/**
 * La animación de Sueño, bajo el héroe de `/pilares/sueno` (≈ 2 min).
 *
 * Cuenta lo que la página ya dice —la luz eléctrica, el costo oculto, el santuario, la descarga
 * mental y las dos anclas de la práctica— sin ningún dato nuevo. El guion completo y por qué va en
 * este orden están en `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares.md`.
 *
 * **Cada duración sale de la narración**, con la misma regla que la animación de los cuatro
 * pilares: lo que tarda el narrador en el idioma más lento, más 0,35 s de entrada y 0,65 s de
 * respiro, en cuartos de segundo (`scripts/animations/prepare-narration.mjs` la calcula).
 *
 * Las ilustraciones las genera `scripts/animations/pillar-sleep.manifest.json`; los puntos de cada
 * efecto están medidos sobre ellas, en % de su ancho y alto.
 */
export const SLEEP_STORY: PillarStory = {
  pillar: "sleep",
  animationId: "pillar-sleep",
  slug: "sueno",
  script: [
    { id: "before", pillar: "sleep", beatDurationsMs: [11500, 9750] },
    { id: "change", pillar: "sleep", beatDurationsMs: [10250, 7250] },
    { id: "cost", pillar: "sleep", beatDurationsMs: [9000, 9250, 7500] },
    {
      id: "counterweight",
      pillar: "sleep",
      beatDurationsMs: [9000, 8250, 8500],
    },
    { id: "practice", pillar: "sleep", beatDurationsMs: [9250, 11750, 5000] },
  ],
  scenes: {
    before: {
      beats: [
        {
          art: "sleep-before-1",
          camera: {
            origin: { x: 50, y: 62 },
            from: { scale: 1.03 },
            to: { scale: 1.11 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 100, height: 40 },
              count: 18,
            },
            {
              kind: "glow",
              at: { x: 50, y: 72 },
              radius: 150,
              color: "#fb923c",
            },
            { kind: "embers", at: { x: 50, y: 73 }, count: 12 },
          ],
        },
        {
          art: "sleep-before-2",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.12, y: 3 },
            to: { scale: 1.03 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 100, height: 45 },
              count: 14,
            },
            {
              kind: "glow",
              at: { x: 50, y: 23 },
              radius: 130,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 30, y: 35, width: 35, height: 35 },
              count: 14,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    change: {
      beats: [
        {
          art: "sleep-change-1",
          camera: {
            origin: { x: 50, y: 50 },
            from: { scale: 1.1, x: 2 },
            to: { scale: 1.1, x: -2 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 35 },
              radius: 260,
              color: "#fbbf24",
            },
            {
              kind: "glow",
              at: { x: 67, y: 8 },
              radius: 70,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 45, y: 16 },
              radius: 60,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 23, y: 13 },
              radius: 60,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "sleep-change-2",
          camera: {
            origin: { x: 30, y: 40 },
            from: { scale: 1.03 },
            to: { scale: 1.13 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 24, y: 18 },
              radius: 130,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 40, y: 30 },
              radius: 100,
              color: "#fef3c7",
            },
            {
              kind: "glow",
              at: { x: 35, y: 58 },
              radius: 110,
              color: "#60a5fa",
            },
          ],
        },
      ],
    },
    cost: {
      beats: [
        {
          art: "sleep-cost-1",
          camera: {
            origin: { x: 45, y: 45 },
            from: { scale: 1.12, x: -1.5 },
            to: { scale: 1.04, x: 1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 48, y: 35 },
              radius: 170,
              color: "#a5b4fc",
            },
            {
              kind: "glow",
              at: { x: 46, y: 62 },
              radius: 55,
              color: "#f472b6",
            },
          ],
        },
        {
          art: "sleep-cost-2",
          camera: {
            origin: { x: 58, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            { kind: "steam", at: { x: 48, y: 62 } },
            {
              kind: "glow",
              at: { x: 32, y: 20 },
              radius: 45,
              color: "#e0e7ff",
            },
            {
              kind: "motes",
              area: { x: 76, y: 25, width: 20, height: 35 },
              count: 10,
            },
          ],
        },
        {
          art: "sleep-cost-3",
          camera: {
            origin: { x: 38, y: 55 },
            from: { scale: 1.04, x: 1.5 },
            to: { scale: 1.12, x: -1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 79, y: 52 },
              radius: 110,
              color: "#fb923c",
            },
            {
              kind: "glow",
              at: { x: 66, y: 78 },
              radius: 120,
              color: "#fdba74",
            },
            {
              kind: "motes",
              area: { x: 70, y: 52, width: 15, height: 20 },
              count: 8,
              color: "#fed7aa",
            },
          ],
        },
      ],
    },
    counterweight: {
      beats: [
        {
          art: "sleep-counterweight-1",
          camera: {
            origin: { x: 40, y: 50 },
            from: { scale: 1.12 },
            to: { scale: 1.03 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 23, y: 58 },
              radius: 150,
              color: "#fdba74",
            },
            {
              kind: "stars",
              area: { x: 56, y: 10, width: 38, height: 35 },
              count: 12,
            },
          ],
        },
        {
          art: "sleep-counterweight-2",
          camera: {
            origin: { x: 60, y: 55 },
            from: { scale: 1.03 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 82, y: 30 },
              radius: 160,
              color: "#c7d2fe",
            },
            {
              kind: "motes",
              area: { x: 55, y: 25, width: 30, height: 40 },
              count: 12,
              color: "#e0e7ff",
            },
            {
              kind: "glow",
              at: { x: 15, y: 55 },
              radius: 50,
              color: "#a5f3fc",
            },
          ],
        },
        {
          art: "sleep-counterweight-3",
          camera: {
            origin: { x: 52, y: 45 },
            from: { scale: 1.13, y: 2 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 56, y: 15 },
              radius: 150,
              color: "#e9d5ff",
            },
            {
              kind: "glow",
              at: { x: 19, y: 58 },
              radius: 130,
              color: "#fdba74",
            },
            {
              kind: "glow",
              at: { x: 54, y: 72 },
              radius: 80,
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
          art: "sleep-practice-1",
          /* Acercada y baja: la ilustración trae una franja lisa arriba que así queda fuera. */
          camera: {
            origin: { x: 55, y: 85 },
            from: { scale: 1.18 },
            to: { scale: 1.13 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 27, y: 38 },
              radius: 130,
              color: "#fdba74",
            },
            {
              kind: "glow",
              at: { x: 67, y: 32 },
              radius: 60,
              color: "#93c5fd",
            },
            {
              kind: "stars",
              area: { x: 1, y: 15, width: 18, height: 30 },
              count: 8,
            },
          ],
        },
        {
          art: "sleep-practice-2",
          camera: {
            origin: { x: 45, y: 50 },
            from: { scale: 1.04, x: -1 },
            to: { scale: 1.1, x: 1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 54, y: 47 },
              radius: 220,
              color: "#fde68a",
            },
            {
              kind: "rays",
              from: { x: 54, y: 47 },
              angle: 250,
              spread: 120,
              length: 1000,
            },
            {
              kind: "motes",
              area: { x: 30, y: 20, width: 45, height: 45 },
              count: 14,
            },
          ],
        },
        {
          art: "sleep-practice-3",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.12, y: 3 },
            to: { scale: 1.03 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 35, height: 25 },
              count: 10,
            },
            {
              kind: "glow",
              at: { x: 90, y: 40 },
              radius: 250,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 75, y: 65 },
              radius: 200,
              color: "#fdba74",
            },
          ],
        },
      ],
    },
  },
  captionKeys: {
    before: ["sleep.before.b1", "sleep.before.b2"],
    change: ["sleep.change.b1", "sleep.change.b2"],
    cost: ["sleep.cost.b1", "sleep.cost.b2", "sleep.cost.b3"],
    counterweight: [
      "sleep.counterweight.b1",
      "sleep.counterweight.b2",
      "sleep.counterweight.b3",
    ],
    practice: ["sleep.practice.b1", "sleep.practice.b2", "sleep.practice.b3"],
  },
  chipKeys: {
    before: "sleep.before.chip",
    change: "sleep.change.chip",
    cost: "sleep.cost.chip",
    counterweight: "sleep.counterweight.chip",
    practice: "sleep.practice.chip",
  },
  regionLabelKey: "sleep.regionLabel",
  looks: {
    before: { ...SLEEP_LOOK, glow: ["#312e81", "#7c3aed", "#f97316"] },
    change: { ...SLEEP_LOOK, glow: ["#facc15", "#7c3aed", "#1e3a8a"] },
    cost: { ...SLEEP_LOOK, glow: ["#475569", "#6366f1", "#fb923c"] },
    counterweight: { ...SLEEP_LOOK, glow: ["#f59e0b", "#7c3aed", "#312e81"] },
    practice: { ...SLEEP_LOOK, glow: ["#fbbf24", "#f472b6", "#7c3aed"] },
  },
  videoAccent: "#a78bfa",
  soundtrackBase: "/animations/pilares/sonido-sueno",
};
