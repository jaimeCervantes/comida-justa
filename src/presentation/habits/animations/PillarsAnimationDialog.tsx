"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";
import { MdClose } from "react-icons/md";

/**
 * La animación se descarga al abrir el diálogo, no antes: el resto del sitio no debe cargar GSAP ni
 * las escenas para alguien que quizá nunca pulse «Ver ahora».
 */
const PillarsOverviewAnimation = dynamic(
  () => import("./PillarsOverviewAnimation"),
  {
    ssr: false,
    loading: () => (
      <div className="aspect-[4/3] w-full animate-pulse rounded-[1.75rem] bg-slate-900/60 sm:aspect-video" />
    ),
  },
);

/**
 * La animación de los cuatro pilares encima de la página, abierta desde la invitación.
 *
 * Sigue el patrón de `MediaPreviewDialog` (un `div` con `role="dialog"` y no un `<dialog>` nativo,
 * porque `showModal()` no existe en jsdom): `Escape`, el clic en el fondo, el foco al abrir y su
 * devolución al cerrar. Además bloquea el desplazamiento de la página de detrás mientras está
 * abierto: en un teléfono, deslizar sobre el fondo movería la página y no el diálogo.
 */
export default function PillarsAnimationDialog({
  label,
  closeLabel,
  practicesHref,
  onClose,
}: {
  label: string;
  closeLabel: string;
  practicesHref: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  return (
    /* biome-ignore lint/a11y/useKeyWithClickEvents: el fondo es un atajo de ratón; `Escape` y el
       botón de cerrar ya lo ofrecen con teclado. */
    <div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      data-testid="pillars-animation-dialog"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-950/80 p-3 backdrop-blur-sm sm:items-center sm:p-8"
    >
      <div className="relative my-auto w-full max-w-4xl rounded-panel bg-surface-background p-4 shadow-2xl sm:p-6">
        <button
          type="button"
          ref={closeRef}
          onClick={onClose}
          aria-label={closeLabel}
          data-testid="pillars-animation-dialog-close"
          className="focus-ring absolute -top-2 -right-2 z-10 rounded-full bg-surface-elevation-1 p-2 text-text-base shadow-lg ring-1 ring-black/10 hover:bg-surface-elevation-2 sm:-top-3 sm:-right-3"
        >
          <MdClose aria-hidden size={22} />
        </button>
        <PillarsOverviewAnimation
          placement="invite"
          practicesHref={practicesHref}
        />
      </div>
    </div>
  );
}
