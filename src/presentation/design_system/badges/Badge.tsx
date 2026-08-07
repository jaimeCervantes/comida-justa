import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "../styling/merge-class-names";

/**
 * La insignia del sitio: una sola forma, muchos tonos.
 *
 * Antes existía tres veces —`SoldOutBadge`, `ProvenanceBadge` y `CategoryTag`— con el mismo
 * `inline-flex items-center rounded-full px-3 py-1 text-sm` copiado y tres colores distintos. La
 * forma vive aquí; el color es una variante; el texto lo pone quien la usa.
 *
 * **No llama a `useTranslations` a propósito.** El design system tiene que poder renderizarse
 * fuera del `NextIntlClientProvider` (`src/app/not-found.tsx` vive fuera de `[locale]`), así que el
 * texto entra ya traducido como `children`. Misma regla que `loadingLabel` en `Button`.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm",
  {
    variants: {
      tone: {
        /** Lo que dejó de estar disponible: no compite por atención. */
        neutral:
          "bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
        /** Procedencia: la afirmación de confianza de la tarjeta. Verde de marca. */
        brand: "bg-pw-lightgreen/15 text-pw-green dark:text-pw-lightgreen",
        /** Taxonomía: naranja de marca, para clasificar sin prometer nada. */
        accent: "bg-pw-orange/10 text-pw-orange",

        /* Los cuatro pilares. `soft` de fondo, `ink` de tinta: el par está verificado contra AA
           en `pillarPalette.contrast.test.ts`, en claro y en oscuro. */
        sleep: "bg-pillar-sleep-soft text-pillar-sleep-ink",
        nutrition: "bg-pillar-nutrition-soft text-pillar-nutrition-ink",
        movement: "bg-pillar-movement-soft text-pillar-movement-ink",
        mindSpirit: "bg-pillar-mindSpirit-soft text-pillar-mindSpirit-ink",
      },
      emphasis: {
        soft: "font-medium",
        /** Para lo que el visitante debe creer antes que el resto de la tarjeta. */
        strong: "font-semibold",
      },
    },
    defaultVariants: {
      tone: "neutral",
      emphasis: "soft",
    },
  },
);

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> &
  VariantProps<typeof badgeVariants> & {
    children?: ReactNode;
  };

/** Sin contenido no se pinta nada: una insignia vacía es un hueco, no una insignia. */
export function Badge({
  tone,
  emphasis,
  className,
  children,
  ...moreProps
}: BadgeProps) {
  if (children === null || children === undefined || children === "") {
    return null;
  }

  return (
    <span
      className={cn(badgeVariants({ tone, emphasis }), className)}
      {...moreProps}
    >
      {children}
    </span>
  );
}
