import type { OverviewSceneId } from "./pillarsOverviewScript";
import type { IllustratedSceneConfig } from "./scenes/IllustratedScene";

/**
 * Qué se ve en cada subtítulo de la animación de los cuatro pilares.
 *
 * Las ilustraciones son 3D de arcilla, en la estética del logo, generadas con Gemini 3 Pro Image a
 * partir de una hoja de personajes (Ana, Leo, la abuela Rosa y Tomás) para que sean los mismos en
 * todas las escenas. Las indicaciones y el proceso están en la bitácora de la feature.
 *
 * Los puntos de cada efecto están medidos sobre la ilustración, en % de su ancho y alto. La cámara
 * alterna acercarse, alejarse y recorrer: el mismo movimiento dos veces seguidas se nota.
 */
export const OVERVIEW_SCENES: Record<OverviewSceneId, IllustratedSceneConfig> =
  {
    intro: {
      beats: [
        {
          art: "intro-1",
          camera: {
            origin: { x: 48, y: 50 },
            from: { scale: 1.14, x: 1.5 },
            to: { scale: 1.04, x: -1 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 45, height: 28 },
              count: 16,
            },
            { kind: "embers", at: { x: 25, y: 71 }, count: 10 },
            {
              kind: "glow",
              at: { x: 84, y: 42 },
              radius: 90,
              color: "#38bdf8",
            },
            {
              kind: "glow",
              at: { x: 67, y: 50 },
              radius: 60,
              color: "#f472b6",
            },
          ],
        },
        {
          art: "intro-2",
          camera: {
            origin: { x: 38, y: 50 },
            from: { scale: 1.04 },
            to: { scale: 1.13 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 29, y: 75 },
              radius: 140,
              color: "#60a5fa",
            },
            {
              kind: "glow",
              at: { x: 37, y: 14 },
              radius: 120,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "intro-3",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.16, y: 3 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 32, y: 32 },
              radius: 70,
              color: "#a78bfa",
            },
            {
              kind: "glow",
              at: { x: 44, y: 31 },
              radius: 70,
              color: "#fb923c",
            },
            {
              kind: "glow",
              at: { x: 56, y: 32 },
              radius: 70,
              color: "#4ade80",
            },
            {
              kind: "glow",
              at: { x: 70, y: 33 },
              radius: 70,
              color: "#38bdf8",
            },
            {
              kind: "motes",
              area: { x: 10, y: 20, width: 80, height: 60 },
              count: 20,
              color: "#fde68a",
            },
          ],
        },
      ],
    },
    sleep: {
      beats: [
        {
          art: "sleep-1",
          camera: {
            origin: { x: 49, y: 70 },
            from: { scale: 1.06, x: -2 },
            to: { scale: 1.12, x: 1.5 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 100, height: 18 },
              count: 14,
            },
            {
              kind: "glow",
              at: { x: 49, y: 82 },
              radius: 160,
              color: "#fb923c",
            },
            { kind: "embers", at: { x: 49, y: 80 }, count: 14 },
          ],
        },
        {
          art: "sleep-2",
          camera: {
            origin: { x: 36, y: 55 },
            from: { scale: 1.03 },
            to: { scale: 1.14 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 58, y: 20, width: 38, height: 45 },
              count: 14,
            },
            {
              kind: "glow",
              at: { x: 40, y: 30 },
              radius: 110,
              color: "#fde68a",
            },
            {
              kind: "glow",
              at: { x: 45, y: 62 },
              radius: 60,
              color: "#f472b6",
            },
            {
              kind: "glow",
              at: { x: 35, y: 57 },
              radius: 150,
              color: "#60a5fa",
            },
          ],
        },
        {
          art: "sleep-3",
          camera: {
            origin: { x: 60, y: 45 },
            from: { scale: 1.14 },
            to: { scale: 1.03 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 80, y: 32 },
              radius: 180,
              color: "#fde68a",
            },
            {
              kind: "rays",
              from: { x: 80, y: 30 },
              angle: 200,
              spread: 30,
              length: 1300,
            },
            {
              kind: "motes",
              area: { x: 50, y: 15, width: 40, height: 55 },
              count: 18,
            },
          ],
        },
      ],
    },
    nutrition: {
      beats: [
        {
          art: "nutrition-1",
          camera: {
            origin: { x: 50, y: 55 },
            from: { scale: 1.1, x: 2 },
            to: { scale: 1.04, x: -1.5 },
          },
          atmosphere: [
            {
              kind: "motes",
              area: { x: 0, y: 10, width: 100, height: 70 },
              count: 18,
              color: "#fde68a",
            },
          ],
        },
        {
          art: "nutrition-2",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.04 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 24, y: 15 },
              radius: 160,
              color: "#e0f2fe",
            },
            {
              kind: "glow",
              at: { x: 78, y: 15 },
              radius: 160,
              color: "#e0f2fe",
            },
            {
              kind: "motes",
              area: { x: 0, y: 20, width: 100, height: 50 },
              count: 10,
              color: "#e2e8f0",
            },
          ],
        },
        {
          art: "nutrition-3",
          camera: {
            origin: { x: 52, y: 72 },
            from: { scale: 1.18 },
            to: { scale: 1.04 },
          },
          atmosphere: [
            { kind: "steam", at: { x: 47, y: 60 } },
            {
              kind: "motes",
              area: { x: 0, y: 0, width: 100, height: 50 },
              count: 12,
            },
          ],
        },
      ],
    },
    movement: {
      beats: [
        {
          art: "movement-1",
          camera: {
            origin: { x: 50, y: 55 },
            from: { scale: 1.08, x: 2.5 },
            to: { scale: 1.08, x: -2.5 },
          },
          atmosphere: [
            {
              kind: "motes",
              area: { x: 0, y: 40, width: 100, height: 50 },
              count: 14,
              color: "#fef3c7",
            },
          ],
        },
        {
          art: "movement-2",
          camera: {
            origin: { x: 50, y: 50 },
            from: { scale: 1.02 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 21, y: 57 },
              radius: 90,
              color: "#f9a8d4",
            },
            {
              kind: "glow",
              at: { x: 80, y: 55 },
              radius: 90,
              color: "#f9a8d4",
            },
          ],
        },
        {
          art: "movement-3",
          camera: {
            origin: { x: 45, y: 60 },
            from: { scale: 1.12, x: -2 },
            to: { scale: 1.04, x: 1 },
          },
          atmosphere: [
            {
              kind: "motes",
              area: { x: 0, y: 30, width: 100, height: 60 },
              count: 16,
              color: "#fef9c3",
            },
          ],
        },
      ],
    },
    mindSpirit: {
      beats: [
        {
          art: "mind-1",
          camera: {
            origin: { x: 50, y: 62 },
            from: { scale: 1.04 },
            to: { scale: 1.14 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 100, height: 25 },
              count: 18,
            },
            {
              kind: "glow",
              at: { x: 50, y: 70 },
              radius: 200,
              color: "#fb923c",
            },
            { kind: "embers", at: { x: 50, y: 68 }, count: 16 },
          ],
        },
        {
          art: "mind-2",
          camera: {
            origin: { x: 50, y: 35 },
            from: { scale: 1.1, y: -3 },
            to: { scale: 1.1, y: 3 },
          },
          atmosphere: [
            {
              kind: "stars",
              area: { x: 0, y: 0, width: 100, height: 32 },
              count: 22,
            },
            ...[22, 31, 44, 55, 69, 78].flatMap((x) =>
              [50, 72].map((y) => ({
                kind: "glow" as const,
                at: { x, y },
                radius: 36,
                color: "#60a5fa",
              })),
            ),
          ],
        },
        {
          art: "mind-3",
          camera: {
            origin: { x: 50, y: 55 },
            from: { scale: 1.12 },
            to: { scale: 1.03 },
          },
          atmosphere: [
            { kind: "ripples", at: { x: 50, y: 52 }, radius: 170 },
            {
              kind: "motes",
              area: { x: 0, y: 0, width: 100, height: 60 },
              count: 12,
              color: "#fff7ed",
            },
          ],
        },
      ],
    },
    closing: {
      logo: "closing",
      beats: [
        {
          art: "closing-1",
          camera: {
            origin: { x: 50, y: 50 },
            from: { scale: 1.03 },
            to: { scale: 1.12 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 50, y: 43 },
              radius: 130,
              color: "#fb7185",
            },
            {
              kind: "motes",
              area: { x: 10, y: 20, width: 80, height: 60 },
              count: 16,
              color: "#e9d5ff",
            },
          ],
        },
        {
          art: "closing-2",
          camera: {
            origin: { x: 50, y: 45 },
            from: { scale: 1.12, y: 2 },
            to: { scale: 1.02 },
          },
          atmosphere: [
            {
              kind: "glow",
              at: { x: 52, y: 40 },
              radius: 220,
              color: "#fde68a",
            },
            {
              kind: "rays",
              from: { x: 52, y: 40 },
              angle: 270,
              spread: 160,
              length: 900,
            },
            {
              kind: "motes",
              area: { x: 0, y: 20, width: 100, height: 60 },
              count: 14,
            },
          ],
        },
      ],
    },
  };

/** Todas las ilustraciones, en orden de aparición: para precargarlas mientras se reproduce. */
export const OVERVIEW_ARTS: readonly string[] = Object.values(
  OVERVIEW_SCENES,
).flatMap((scene) => scene.beats.map((item) => item.art));
