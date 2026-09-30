import type gsap from "gsap";
import { useId } from "react";
import { seededRandom, seedFrom } from "./seededRandom";

/** El lienzo de las ilustraciones, en píxeles: las imágenes se preparan a 1920 × 1072. */
export const ART_WIDTH = 1920;
export const ART_HEIGHT = 1072;

/** Un punto de la ilustración, en porcentaje de su ancho y de su alto. */
export interface ArtPoint {
  x: number;
  y: number;
}

/** Una zona de la ilustración, en porcentaje. */
export interface ArtArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Lo que vive encima de una ilustración: la parte del cuadro que se mueve.
 *
 * Una imagen quieta con cámara es una diapositiva; con brasas que suben, estrellas que titilan y
 * polvo flotando en un rayo de sol, es un plano de película. Cada efecto se ancla a un punto de la
 * ilustración y se mueve con ella cuando la cámara se acerca o recorre el cuadro.
 */
export type Atmosphere =
  | { kind: "embers"; at: ArtPoint; count?: number }
  | { kind: "glow"; at: ArtPoint; radius: number; color: string }
  | { kind: "stars"; area: ArtArea; count?: number }
  | { kind: "motes"; area: ArtArea; count?: number; color?: string }
  | {
      kind: "rays";
      from: ArtPoint;
      /** Hacia dónde apuntan, en grados: 0 es a la derecha, 90 hacia abajo. */
      angle: number;
      spread?: number;
      length?: number;
      color?: string;
    }
  | { kind: "ripples"; at: ArtPoint; radius: number; color?: string }
  | { kind: "steam"; at: ArtPoint };

const toPx = (point: ArtPoint) => ({
  x: (point.x / 100) * ART_WIDTH,
  y: (point.y / 100) * ART_HEIGHT,
});

interface Particle {
  x: number;
  y: number;
  r: number;
  period: number;
  offset: number;
  dx: number;
  dy: number;
}

/** Las partículas de un efecto: siempre las mismas para el mismo nombre (se dibujan y se animan). */
function particlesOf(item: Atmosphere, name: string): Particle[] {
  const random = seededRandom(seedFrom(name));
  const inArea = (area: ArtArea) => ({
    x: ((area.x + random() * area.width) / 100) * ART_WIDTH,
    y: ((area.y + random() * area.height) / 100) * ART_HEIGHT,
  });
  switch (item.kind) {
    case "embers": {
      const origin = toPx(item.at);
      return Array.from({ length: item.count ?? 14 }, () => ({
        x: origin.x + (random() - 0.5) * 70,
        y: origin.y - random() * 30,
        r: 2.4 + random() * 3,
        period: 1.4 + random() * 1.2,
        offset: random() * 1.6,
        dx: (random() - 0.5) * 90,
        dy: -(140 + random() * 200),
      }));
    }
    case "stars":
      return Array.from({ length: item.count ?? 18 }, () => ({
        ...inArea(item.area),
        r: 5 + random() * 7,
        period: 1.1 + random() * 1.6,
        offset: random() * 1.5,
        dx: 0,
        dy: 0,
      }));
    case "motes":
      return Array.from({ length: item.count ?? 16 }, () => ({
        ...inArea(item.area),
        r: 2 + random() * 3.5,
        period: 3 + random() * 3,
        offset: random() * 2,
        dx: (random() - 0.5) * 50,
        dy: -(30 + random() * 60),
      }));
    default:
      return [];
  }
}

function starPath({ x, y, r }: Particle): string {
  const k = r * 0.28;
  return `M${x} ${y - r} L${x + k} ${y - k} L${x + r} ${y} L${x + k} ${y + k} L${x} ${y + r} L${x - k} ${y + k} L${x - r} ${y} L${x - k} ${y - k} Z`;
}

function rayWedges(item: Extract<Atmosphere, { kind: "rays" }>) {
  const origin = toPx(item.from);
  const length = item.length ?? 900;
  const spread = item.spread ?? 26;
  return [-2, -1, 0, 1, 2].map((step) => {
    const angle = ((item.angle + (step * spread) / 4) * Math.PI) / 180;
    const half = ((3 + (Math.abs(step) % 2) * 2) * Math.PI) / 180;
    const tip = (delta: number) =>
      `${origin.x + Math.cos(angle + delta) * length} ${origin.y + Math.sin(angle + delta) * length}`;
    return `M${origin.x} ${origin.y} L${tip(-half)} L${tip(half)} Z`;
  });
}

function AtmosphereItem({ item, id }: { item: Atmosphere; id: string }) {
  const gradient = `${useId()}-gradient`;
  const className = `atm-${id}`;
  switch (item.kind) {
    case "embers":
      return (
        <g className={className}>
          {particlesOf(item, id).map((particle, index) => (
            <circle
              key={`${particle.x}-${particle.y}`}
              className="p"
              cx={particle.x}
              cy={particle.y}
              r={particle.r}
              fill={index % 2 === 0 ? "#fdba74" : "#fde68a"}
              opacity={0}
            />
          ))}
        </g>
      );
    case "glow": {
      const center = toPx(item.at);
      return (
        <g className={className}>
          <defs>
            <radialGradient id={gradient}>
              <stop offset="0" stopColor={item.color} stopOpacity={0.75} />
              <stop offset="0.4" stopColor={item.color} stopOpacity={0.3} />
              <stop offset="1" stopColor={item.color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle
            className="p"
            cx={center.x}
            cy={center.y}
            r={item.radius}
            fill={`url(#${gradient})`}
            style={{ mixBlendMode: "screen" }}
          />
        </g>
      );
    }
    case "stars":
      return (
        <g className={className}>
          {particlesOf(item, id).map((particle) => (
            <path
              key={`${particle.x}-${particle.y}`}
              className="p"
              d={starPath(particle)}
              fill="#fff"
              opacity={0.2}
            />
          ))}
        </g>
      );
    case "motes":
      return (
        <g className={className}>
          {particlesOf(item, id).map((particle) => (
            <circle
              key={`${particle.x}-${particle.y}`}
              className="p"
              cx={particle.x}
              cy={particle.y}
              r={particle.r}
              fill={item.color ?? "#fff7d6"}
              opacity={0.55}
            />
          ))}
        </g>
      );
    case "rays": {
      const origin = toPx(item.from);
      return (
        <g className={className} style={{ mixBlendMode: "screen" }}>
          <defs>
            <radialGradient
              id={gradient}
              gradientUnits="userSpaceOnUse"
              cx={origin.x}
              cy={origin.y}
              r={item.length ?? 900}
            >
              <stop
                offset="0"
                stopColor={item.color ?? "#fde68a"}
                stopOpacity={0.55}
              />
              <stop
                offset="1"
                stopColor={item.color ?? "#fde68a"}
                stopOpacity={0}
              />
            </radialGradient>
          </defs>
          {rayWedges(item).map((wedge) => (
            <path
              key={wedge}
              className="p"
              d={wedge}
              fill={`url(#${gradient})`}
            />
          ))}
        </g>
      );
    }
    case "ripples": {
      const center = toPx(item.at);
      return (
        <g className={className}>
          {[0, 1, 2].map((ring) => (
            <circle
              key={ring}
              className="p"
              cx={center.x}
              cy={center.y}
              r={item.radius}
              fill="none"
              stroke={item.color ?? "#fde68a"}
              strokeWidth={6}
              opacity={0}
            />
          ))}
        </g>
      );
    }
    case "steam": {
      const base = toPx(item.at);
      return (
        <g className={className}>
          {[-40, 0, 40].map((shift) => (
            <path
              key={shift}
              className="p"
              d={`M${base.x + shift} ${base.y} c -18 -40 18 -60 0 -100 c -18 -40 18 -60 0 -100`}
              pathLength={1}
              strokeDasharray="0.35 1"
              strokeDashoffset={1}
              stroke="#fff"
              strokeOpacity={0.65}
              strokeWidth={7}
              strokeLinecap="round"
              fill="none"
            />
          ))}
        </g>
      );
    }
  }
}

/** La capa de efectos de una ilustración, en el mismo encuadre que la imagen (`cover`). */
export function AtmosphereLayer({
  items,
  name,
}: {
  items: readonly Atmosphere[];
  name: string;
}) {
  const entries = items.map((item, index) => ({
    item,
    id: `${name}-${index}`,
  }));
  return (
    <svg
      viewBox={`0 0 ${ART_WIDTH} ${ART_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute inset-0 h-full w-full"
    >
      {entries.map(({ item, id }) => (
        <AtmosphereItem key={id} item={item} id={id} />
      ))}
    </svg>
  );
}

function repeatsFor(span: number, period: number): number {
  return Math.max(0, Math.ceil(span / period) - 1);
}

/**
 * Anima la capa de efectos entre `from` y `until` (segundos de la escena). Las partículas se
 * recalculan con la misma semilla con que se dibujaron, así que cada una recibe su propio ritmo.
 */
export function animateAtmosphere(
  tl: gsap.core.Timeline,
  q: (selector: string) => Element[],
  items: readonly Atmosphere[],
  name: string,
  from: number,
  until: number,
): void {
  items.forEach((item, index) => {
    const id = `${name}-${index}`;
    const elements = q(`.atm-${id} .p`);
    const span = until - from;
    switch (item.kind) {
      case "embers": {
        particlesOf(item, id).forEach((particle, particleIndex) => {
          const start = from + particle.offset;
          tl.fromTo(
            elements[particleIndex],
            { x: 0, y: 0, opacity: 0.95, scale: 1, transformOrigin: "50% 50%" },
            {
              x: particle.dx,
              y: particle.dy,
              opacity: 0,
              scale: 0.4,
              duration: particle.period,
              ease: "power1.out",
              repeat: repeatsFor(until - start, particle.period),
              immediateRender: false,
            },
            start,
          );
        });
        break;
      }
      case "glow":
        tl.fromTo(
          elements,
          { opacity: 0.7, scale: 0.94, transformOrigin: "50% 50%" },
          {
            opacity: 1,
            scale: 1.08,
            duration: 1.3,
            ease: "sine.inOut",
            repeat: repeatsFor(span, 1.3),
            yoyo: true,
            immediateRender: false,
          },
          from,
        );
        break;
      case "stars":
        particlesOf(item, id).forEach((particle, particleIndex) => {
          tl.fromTo(
            elements[particleIndex],
            { opacity: 0.15, scale: 0.6, transformOrigin: "50% 50%" },
            {
              opacity: 1,
              scale: 1.1,
              duration: particle.period,
              ease: "sine.inOut",
              repeat: repeatsFor(span - particle.offset, particle.period),
              yoyo: true,
              immediateRender: false,
            },
            from + particle.offset,
          );
        });
        break;
      case "motes":
        particlesOf(item, id).forEach((particle, particleIndex) => {
          tl.to(
            elements[particleIndex],
            {
              x: particle.dx,
              y: particle.dy,
              opacity: 0.15,
              duration: particle.period,
              ease: "sine.inOut",
              repeat: repeatsFor(span - particle.offset, particle.period),
              yoyo: true,
            },
            from + particle.offset,
          );
        });
        break;
      case "rays": {
        const origin = toPx(item.from);
        tl.fromTo(
          elements,
          { opacity: 0.45 },
          {
            opacity: 0.95,
            duration: 2.6,
            stagger: 0.35,
            ease: "sine.inOut",
            repeat: repeatsFor(span, 2.6),
            yoyo: true,
            immediateRender: false,
          },
          from,
        );
        tl.fromTo(
          q(`.atm-${id}`),
          { rotation: -1.5, svgOrigin: `${origin.x} ${origin.y}` },
          {
            rotation: 1.5,
            svgOrigin: `${origin.x} ${origin.y}`,
            duration: 5,
            ease: "sine.inOut",
            repeat: repeatsFor(span, 5),
            yoyo: true,
            immediateRender: false,
          },
          from,
        );
        break;
      }
      case "ripples": {
        const center = toPx(item.at);
        elements.forEach((ring, ringIndex) => {
          const start = from + ringIndex * 0.87;
          tl.fromTo(
            ring,
            { scale: 0.3, opacity: 0.8, svgOrigin: `${center.x} ${center.y}` },
            {
              scale: 1.6,
              opacity: 0,
              svgOrigin: `${center.x} ${center.y}`,
              duration: 2.6,
              ease: "sine.out",
              repeat: repeatsFor(until - start, 2.6),
              immediateRender: false,
            },
            start,
          );
        });
        break;
      }
      case "steam":
        elements.forEach((plume, plumeIndex) => {
          const start = from + plumeIndex * 0.9;
          tl.fromTo(
            plume,
            { strokeDashoffset: 1, opacity: 0.9 },
            {
              strokeDashoffset: -0.35,
              opacity: 0,
              duration: 2.8,
              ease: "sine.inOut",
              repeat: repeatsFor(until - start, 2.8),
              immediateRender: false,
            },
            start,
          );
        });
        break;
    }
  });
}
