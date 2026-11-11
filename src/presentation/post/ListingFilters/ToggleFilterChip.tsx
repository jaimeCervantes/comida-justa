import { type AppHref, Link } from "~/i18n/navigation";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { CHIP_OFF, CHIP_ON, FILTER_CHIP } from "./filterChip";

interface ToggleFilterChipProps {
  /** La misma dirección con el interruptor al revés. */
  href: AppHref;
  pressed: boolean;
  testId?: string;
  children: React.ReactNode;
}

/**
 * Un filtro que se enciende y se apaga: «Solo con existencia», «En promoción».
 *
 * Un enlace y no una casilla: el filtro vive en la dirección, así que se comparte, se guarda y
 * vuelve con el botón de atrás como cualquier otro. Una casilla controlada por JavaScript no haría
 * ninguna de las tres. La casilla dibujada es solo eso, un dibujo: el estado lo dice `aria-pressed`.
 */
export default function ToggleFilterChip({
  href,
  pressed,
  testId,
  children,
}: ToggleFilterChipProps): React.ReactElement {
  return (
    <Link
      href={href}
      aria-pressed={pressed}
      data-testid={testId}
      className={cn(FILTER_CHIP, "gap-2", pressed ? CHIP_ON : CHIP_OFF)}
    >
      <span
        aria-hidden
        className={cn(
          "grid size-4 shrink-0 place-items-center rounded-chip border",
          pressed
            ? "border-white bg-white/20 text-white"
            : "border-border-field",
        )}
      >
        {pressed ? "✓" : null}
      </span>
      {children}
    </Link>
  );
}
