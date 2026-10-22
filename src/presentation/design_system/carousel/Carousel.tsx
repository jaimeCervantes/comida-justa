"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { cn } from "~/presentation/design_system/styling/merge-class-names";

/** Cada cuánto avanza solo. Lo bastante para leer un precio y un título. */
export const CAROUSEL_INTERVAL_MS = 6000;

/** Cuánto hay que arrastrar el dedo para que cuente como «pasar», y no como un toque. */
const SWIPE_THRESHOLD_PX = 40;

/**
 * Los textos de los controles, ya traducidos.
 *
 * `slide` y `goTo` son plantillas con `{position}` y `{count}`, no funciones: quien suele traducirlos
 * es un componente de servidor, y una función no cruza al cliente.
 */
export type CarouselLabels = {
  /** El nombre del carrusel para un lector de pantalla. */
  region: string;
  previous: string;
  next: string;
  /** «{position} de {count}». */
  slide: string;
  /** «Ir al {position} de {count}», para cada punto. */
  goTo: string;
};

function fill(template: string, position: number, count: number): string {
  return template
    .replaceAll("{position}", String(position))
    .replaceAll("{count}", String(count));
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* Discretos: papel translúcido sobre la imagen, no un círculo negro que compita con lo que se mira.
   En escritorio aparecen al pasar el cursor o con foco; en pantallas táctiles, donde no hay cursor,
   siempre están. */
const CONTROL =
  "focus-ring grid size-9 place-items-center rounded-full bg-white/85 text-text-base shadow-sm backdrop-blur transition-opacity hover:bg-white [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/carousel:opacity-100 focus-visible:opacity-100";

/**
 * Un carrusel de slides que avanza solo, con puntos, flechas y gesto.
 *
 * - **Avanza cada `CAROUSEL_INTERVAL_MS`** y se detiene mientras el cursor está encima o algo de
 *   adentro tiene el foco: nadie debería perder el slide que está leyendo o a punto de pulsar.
 * - **Con `prefers-reduced-motion`, no avanza solo.** Los controles siguen ahí.
 * - **Solo el slide visible está en la página**; los demás llevan `hidden`, así que ni se tabulan ni
 *   descargan su imagen hasta que les toca (una imagen diferida sin caja no se pide).
 * - Con un solo slide no hay nada que mover: se pinta tal cual, sin controles.
 *
 * No sabe qué hay dentro: recibe los slides ya hechos y los textos de sus controles, que traduce
 * quien lo usa.
 */
export default function Carousel({
  slides,
  labels,
  className,
  testId = "carousel",
}: {
  slides: readonly ReactNode[];
  labels: CarouselLabels;
  className?: string;
  testId?: string;
}) {
  const count = slides.length;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const swipeStart = useRef<number | null>(null);

  useEffect(() => {
    if (count < 2 || paused || prefersReducedMotion()) return;

    const timer = window.setInterval(
      () => setActive((current) => (current + 1) % count),
      CAROUSEL_INTERVAL_MS,
    );

    return () => window.clearInterval(timer);
  }, [count, paused]);

  if (count === 0) return null;
  if (count === 1) return <div className={className}>{slides[0]}</div>;

  const go = (position: number) => setActive((position + count) % count);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowRight") go(active + 1);
    if (event.key === "ArrowLeft") go(active - 1);
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLElement>) => {
    swipeStart.current = event.clientX;
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLElement>) => {
    if (swipeStart.current === null) return;

    const distance = event.clientX - swipeStart.current;

    swipeStart.current = null;
    if (Math.abs(distance) < SWIPE_THRESHOLD_PX) return;
    go(distance < 0 ? active + 1 : active - 1);
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={labels.region}
      data-testid={testId}
      className={cn("group/carousel relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
    >
      {slides.map((slide, index) => (
        // biome-ignore lint/a11y/useSemanticElements: el patrón de carrusel de WAI-ARIA pide role="group" con aria-roledescription="slide"; un <fieldset> es para formularios.
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: los slides no cambian de orden mientras se pintan.
          key={index}
          role="group"
          aria-roledescription="slide"
          aria-label={fill(labels.slide, index + 1, count)}
          data-testid={`${testId}-slide`}
          data-active={index === active}
          hidden={index !== active}
        >
          {slide}
        </div>
      ))}

      <button
        type="button"
        aria-label={labels.previous}
        data-testid={`${testId}-previous`}
        onClick={() => go(active - 1)}
        className={cn(CONTROL, "absolute left-3 top-1/2 -translate-y-1/2")}
      >
        <MdChevronLeft aria-hidden className="size-6" />
      </button>
      <button
        type="button"
        aria-label={labels.next}
        data-testid={`${testId}-next`}
        onClick={() => go(active + 1)}
        className={cn(CONTROL, "absolute right-3 top-1/2 -translate-y-1/2")}
      >
        <MdChevronRight aria-hidden className="size-6" />
      </button>

      {/* Encima de la imagen, abajo al centro: debajo se llevaban un renglón propio de alto. */}
      <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
        {slides.map((_, index) => (
          <button
            // biome-ignore lint/suspicious/noArrayIndexKey: un punto por slide, en el mismo orden.
            key={index}
            type="button"
            aria-label={fill(labels.goTo, index + 1, count)}
            aria-current={index === active}
            data-testid={`${testId}-dot`}
            onClick={() => go(index)}
            className={cn(
              "focus-ring h-1.5 rounded-full transition-all",
              index === active
                ? "w-5 bg-text-base"
                : "w-1.5 bg-text-base/25 hover:bg-text-base/50",
            )}
          />
        ))}
      </div>
    </section>
  );
}
