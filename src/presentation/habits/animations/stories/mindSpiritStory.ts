import type { PillarStory } from "./pillarStory";

const MIND_LOOK = {
  accentInk: "var(--color-pillar-mind-spirit-ink)",
  accentSoft: "var(--color-pillar-mind-spirit-soft)",
} as const;

/**
 * La animación de Mente y espíritu, bajo el héroe de `/pilares/mente-espiritu` (≈ 2 min).
 *
 * Cuenta lo que la página ya dice —la Revolución Digital, el costo oculto de la
 * hiperconectividad, las ventanas de silencio, el arraigo al aire libre y las dos anclas de su
 * práctica— sin ningún dato nuevo. El guion completo está en
 * `docs/features/wellbeing/028-2026-09-29-animaciones-de-los-pilares.md`.
 *
 * **Las duraciones están estimadas**, porque su voz llega al final: lo que tardaría el narrador en
 * decir cada frase según la velocidad a la que lee (medida en las 84 frases ya narradas), con la
 * misma regla que las demás (ver `sleepStory.ts`) y 0,25 s de margen. Al narrarla se miden y se
 * ajustan, y hasta entonces va sin sonido. Las ilustraciones las genera
 * `scripts/animations/pillar-mind-spirit.manifest.json`.
 */
export const MIND_SPIRIT_STORY: PillarStory = {
  pillar: "mindSpirit",
  animationId: "pillar-mind-spirit",
  slug: "mente-espiritu",
  script: [
    { id: "before", pillar: "mindSpirit", beatDurationsMs: [8000, 9500] },
    { id: "change", pillar: "mindSpirit", beatDurationsMs: [11000, 8250] },
    {
      id: "cost",
      pillar: "mindSpirit",
      beatDurationsMs: [11250, 9750, 8250],
    },
    {
      id: "counterweight",
      pillar: "mindSpirit",
      beatDurationsMs: [9750, 7500, 8500],
    },
    {
      id: "practice",
      pillar: "mindSpirit",
      beatDurationsMs: [9750, 8000, 4250],
    },
  ],
  scenes: {
    before: {
      beats: [
        {
          art: "mind-before-1",
          camera: {
            origin: { x: 50, y: 60 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 20, y: 0, width: 60, height: 20 },
              count: 14,
            },
            {
              kind: "glow",
              at: { x: 50, y: 75 },
              radius: 200,
              color: "#fb923c",
            },
            { kind: "embers", at: { x: 50, y: 80 }, count: 14 },
            {
              kind: "glow",
              at: { x: 73, y: 10 },
              radius: 50,
              color: "#fef3c7",
            },
          ],
        },
        {
          art: "mind-before-2",
          camera: {
            origin: { x: 45, y: 60 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            { kind: "steam", at: { x: 50, y: 65 } },
            {
              kind: "glow",
              at: { x: 70, y: 20 },
              radius: 250,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    change: {
      beats: [
        {
          art: "mind-change-1",
          camera: {
            origin: { x: 45, y: 40 },
            from: { scale: 1.12, y: 2 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 45, y: 45 },
              radius: 70,
              color: "#93c5fd",
            },
            {
              kind: "glow",
              at: { x: 22, y: 50 },
              radius: 50,
              color: "#93c5fd",
            },
            {
              kind: "stars",
              area: { x: 70, y: 0, width: 30, height: 40 },
              count: 10,
            },
          ],
        },
        {
          art: "mind-change-2",
          camera: {
            origin: { x: 50, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 30 },
              radius: 80,
              color: "#c4b5fd",
            },
            {
              kind: "glow",
              at: { x: 21, y: 50 },
              radius: 100,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    cost: {
      beats: [
        {
          art: "mind-cost-1",
          /* Acercada y baja: la ilustración trae una franja lisa arriba que así queda fuera. */
          camera: {
            origin: { x: 40, y: 95 },
            from: { scale: 1.28 },
            to: { scale: 1.22 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 25 },
              radius: 90,
              color: "#e9d5ff",
            },
            {
              kind: "glow",
              at: { x: 70, y: 35 },
              radius: 120,
              color: "#bfdbfe",
            },
          ],
        },
        {
          art: "mind-cost-2",
          camera: {
            origin: { x: 55, y: 50 },
            from: { scale: 1.1, x: 1.5 },
            to: { scale: 1.1, x: -1.5 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 30, y: 25 },
              radius: 200,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 75, y: 45 },
              radius: 120,
              color: "#93c5fd",
            },
          ],
        },
        {
          art: "mind-cost-3",
          /* Acercada y baja: la ilustración trae una franja lisa arriba que así queda fuera. */
          camera: {
            origin: { x: 55, y: 95 },
            from: { scale: 1.16 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 20 },
              radius: 120,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 15, y: 30 },
              radius: 150,
              color: "#93c5fd",
            },
          ],
        },
      ],
    },
    counterweight: {
      beats: [
        {
          art: "mind-counterweight-1",
          camera: {
            origin: { x: 45, y: 55 },
            from: { scale: 1.1 },
            to: { scale: 1.02 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 80, y: 30 },
              radius: 250,
              color: "#bae6fd",
            },
          ],
        },
        {
          art: "mind-counterweight-2",
          camera: {
            origin: { x: 50, y: 50 },
            from: { scale: 1.08, x: -2 },
            to: { scale: 1.08, x: 2 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 15, y: 20 },
              radius: 150,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 80, y: 30 },
              radius: 120,
              color: "#a5b4fc",
            },
          ],
        },
        {
          art: "mind-counterweight-3",
          camera: {
            origin: { x: 40, y: 55 },
            from: { scale: 1.12 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "ripples",
              at: { x: 40, y: 80 },
              radius: 200,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 60, y: 5 },
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
          art: "mind-practice-1",
          camera: {
            origin: { x: 40, y: 55 },
            from: { scale: 1.04 },
            to: { scale: 1.1 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 15, y: 40 },
              radius: 180,
              color: "#fde68a",
            },
            {
              kind: "motes",
              area: { x: 5, y: 20, width: 40, height: 50 },
              count: 12,
            },
          ],
        },
        {
          art: "mind-practice-2",
          camera: {
            origin: { x: 55, y: 60 },
            from: { scale: 1.1 },
            to: { scale: 1.02 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 80, y: 10 },
              radius: 250,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "mind-practice-3",
          camera: {
            origin: { x: 50, y: 60 },
            from: { scale: 1.1 },
            to: { scale: 1.02 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 40, y: 40 },
              radius: 200,
              color: "#fde68a",
            },
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 100, height: 15 },
              count: 12,
            },
          ],
        },
      ],
    },
  },
  captionKeys: {
    before: ["mindSpirit.before.b1", "mindSpirit.before.b2"],
    change: ["mindSpirit.change.b1", "mindSpirit.change.b2"],
    cost: ["mindSpirit.cost.b1", "mindSpirit.cost.b2", "mindSpirit.cost.b3"],
    counterweight: [
      "mindSpirit.counterweight.b1",
      "mindSpirit.counterweight.b2",
      "mindSpirit.counterweight.b3",
    ],
    practice: [
      "mindSpirit.practice.b1",
      "mindSpirit.practice.b2",
      "mindSpirit.practice.b3",
    ],
  },
  chipKeys: {
    before: "mindSpirit.before.chip",
    change: "mindSpirit.change.chip",
    cost: "mindSpirit.cost.chip",
    counterweight: "mindSpirit.counterweight.chip",
    practice: "mindSpirit.practice.chip",
  },
  regionLabelKey: "mindSpirit.regionLabel",
  looks: {
    before: { ...MIND_LOOK, glow: ["#0ea5e9", "#f97316", "#312e81"] },
    change: { ...MIND_LOOK, glow: ["#1e3a8a", "#6366f1", "#0ea5e9"] },
    cost: { ...MIND_LOOK, glow: ["#6366f1", "#f43f5e", "#475569"] },
    counterweight: { ...MIND_LOOK, glow: ["#14b8a6", "#0ea5e9", "#fde68a"] },
    practice: { ...MIND_LOOK, glow: ["#0ea5e9", "#14b8a6", "#fbbf24"] },
  },
  videoAccent: "#38bdf8",
};
