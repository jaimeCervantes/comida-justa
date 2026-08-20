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
      /**
       * Los tres tonos base pasan al par `soft`/`ink`, como ya estaban los cuatro pilares.
       *
       * Venían de antes de que existieran los tokens y arrastraban dos vicios. Uno, `neutral`
       * pintaba con `gray-200`/`gray-700` crudos de Tailwind: un gris azulado que, sobre el papel
       * cálido del slice 10, se ve como una mancha fría en mitad de la tarjeta. Dos, `brand` y
       * `accent` usaban una opacidad sobre el color de marca (`/15`, `/10`), que es una forma de no
       * decidir: el fondo real dependía de lo que hubiera debajo y la tinta no estaba elegida para
       * él, así que su contraste no se podía medir — solo suponer.
       *
       * Con el par, el contraste está verificado (4.56 a 12.07 según el tono y el tema) y
       * **desaparecen las variantes `dark:`**: la variable ya cambia de valor con el tema, que es
       * la misma regla que sigue `Surface`.
       */
      tone: {
        /** Lo que dejó de estar disponible: no compite por atención. */
        neutral: "bg-surface-elevation-2 text-text-support",
        /** Procedencia: la afirmación de confianza de la tarjeta. Verde de marca. */
        brand: "bg-brand-green-soft text-brand-green-900",
        /** Taxonomía: barro de marca, para clasificar sin prometer nada. */
        accent: "bg-brand-clay-soft text-brand-clay-700",

        /* Los cuatro pilares. `soft` de fondo, `ink` de tinta: el par está verificado contra AA
           en `pillarPalette.contrast.test.ts`, en claro y en oscuro. */
        sleep: "bg-pillar-sleep-soft text-pillar-sleep-ink",
        nutrition: "bg-pillar-nutrition-soft text-pillar-nutrition-ink",
        movement: "bg-pillar-movement-soft text-pillar-movement-ink",
        mindSpirit: "bg-pillar-mind-spirit-soft text-pillar-mind-spirit-ink",
      },
      emphasis: {
        soft: "font-medium",
        /** Para lo que el visitante debe creer antes que el resto de la tarjeta. */
        strong: "font-semibold",
        /**
         * Rellena en vez de teñir, para lo que es nuevo o está activo. Pide el par del botón
         * primario y no un verde suelto: es el mismo relleno, y así hereda su medición y su
         * inversión en oscuro.
         */
        solid: "font-semibold bg-button-primary-bg text-button-primary-text",
      },
    },
    defaultVariants: {
      tone: "neutral",
      emphasis: "soft",
    },
  },
);

/**
 * El círculo del número, cuando la insignia lo lleva.
 *
 * Usa el papel `solid` del pilar con texto blanco encima, que es el único de los tres papeles
 * pensado para llevar texto: `pillarPalette.contrast.test.ts` mide esa pareja desde el slice 3
 * («aguanta texto blanco sobre su relleno sólido») y da entre 4.59 y 5.93. Los tres papeles ya
 * estaban; lo que faltaba era un sitio donde `solid` se usara.
 *
 * Los tonos que no son de pilar caen a la tinta del propio chip: un contador ahí es raro, pero si
 * alguien lo pone tiene que verse.
 */
export const badgeCounterClassName = cva(
  "inline-grid size-5 shrink-0 place-items-center rounded-full text-caption font-semibold leading-none",
  {
    variants: {
      tone: {
        neutral: "bg-text-support text-text-inverse",
        brand: "bg-button-primary-bg text-button-primary-text",
        accent: "bg-brand-clay-600 text-pw-white",
        sleep: "bg-pillar-sleep-solid text-pw-white",
        nutrition: "bg-pillar-nutrition-solid text-pw-white",
        movement: "bg-pillar-movement-solid text-pw-white",
        mindSpirit: "bg-pillar-mind-spirit-solid text-pw-white",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export type BadgeCounterProps = {
  /** `null` es lo que entrega `cva` cuando la variante no se pidió; cae al tono por omisión. */
  tone?: BadgeTone | null;
  className?: string;
  children: ReactNode;
};

/**
 * El círculo suelto, para quien necesita el número sin la insignia.
 *
 * El filtro de pilares es un enlace y no un chip —tiene estados activo/inactivo, borde propio y
 * navega—, así que envolverlo en un `Badge` habría sido meter una insignia dentro de un enlace
 * solo para robarle el círculo. Compartiendo esta pieza, la forma del contador se decide una vez y
 * los dos sitios se ven iguales, que es justo lo que este archivo vino a garantizar.
 */
export function BadgeCounter({ tone, className, children }: BadgeCounterProps) {
  return (
    <span
      /**
       * El número es una redundancia **visual** para una limitación **visual**.
       *
       * Existe porque Movimiento (`#3c7b0f`) y Mente (`#0369a1`) contrastan 1.14 entre sí como
       * tinta: quien no distingue el tono no los separa mirando. Quien usa un lector de pantalla no
       * tiene ese problema — ya recibe «Movimiento», que es inequívoco—, así que anunciar «3
       * Movimiento» solo alarga el nombre accesible de cada filtro sin añadir nada.
       *
       * Es además lo que mantiene estable el contrato de `getByRole(..., { name })`, que es como se
       * localizan estos enlaces en las pruebas y en el e2e.
       */
      aria-hidden="true"
      className={cn(badgeCounterClassName({ tone }), className)}
    >
      {children}
    </span>
  );
}

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>["tone"]>;

export type BadgeProps = Omit<HTMLAttributes<HTMLSpanElement>, "color"> &
  VariantProps<typeof badgeVariants> & {
    /**
     * El número del pilar (1 a 4), dentro de la insignia.
     *
     * `pillarPalette.contrast.test.ts` dejó escrito desde el slice 3 que Movimiento (`#3c7b0f`) y
     * Mente (`#0369a1`) contrastan 1.14 entre sí como tinta: casi la misma luminosidad, solo los
     * separa el tono. Quien no lo distingue no puede saber qué pilar está mirando si el color va
     * solo. Aquella prueba documentaba el límite sin poder arreglarlo; esto es el arreglo.
     *
     * Va como prop y no dentro de `children` para que la forma del círculo la decida el primitivo
     * una sola vez — que es exactamente lo que este componente vino a resolver cuando las tres
     * insignias del slice 3 se copiaban a mano.
     */
    counter?: ReactNode;
    children?: ReactNode;
  };

/** Sin contenido no se pinta nada: una insignia vacía es un hueco, no una insignia. */
export function Badge({
  tone,
  emphasis,
  counter,
  className,
  children,
  ...moreProps
}: BadgeProps) {
  if (children === null || children === undefined || children === "") {
    return null;
  }

  const hasCounter =
    counter !== null && counter !== undefined && counter !== "";

  return (
    <span
      className={cn(
        badgeVariants({ tone, emphasis }),
        /* El círculo se come el relleno izquierdo: sin esto queda descentrado dentro del chip. */
        hasCounter && "pl-1",
        className,
      )}
      {...moreProps}
    >
      {hasCounter ? <BadgeCounter tone={tone}>{counter}</BadgeCounter> : null}
      {children}
    </span>
  );
}
