import type { ReactNode } from "react";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import {
  CARD_PADDING,
  CARD_STACK,
} from "~/presentation/design_system/surfaces/cardSpacing";
import { Surface } from "~/presentation/design_system/surfaces/Surface";

/**
 * Un bloque de «Mi cuenta».
 *
 * Los cinco bloques de la página repetían el mismo patrón —`<section>`, un encabezado en negrita y
 * a veces un párrafo de intro— cada uno con sus propias clases. Al mismo nivel visual y sin
 * superficie que los separe, la página se leía como una lista de formularios sin jerarquía: no se
 * veía dónde acaba uno y empieza el siguiente.
 *
 * **El encabezado es siempre `h2`.** El único `h1` de la página lo pone `page.tsx`. Antes había
 * tres — el de la página, el de la tarjeta de la tienda y el del alta— y un lector de pantalla
 * anunciaba tres títulos principales para una sola pantalla.
 *
 * No traduce nada: recibe el texto ya resuelto, igual que `Button` recibe su `loadingLabel`.
 */
export default function AccountCard({
  title,
  intro,
  children,
  testId,
  className,
}: {
  title: string;
  /** Para qué sirve el bloque. Acepta nodos porque alguno lleva la dirección en negrita. */
  intro?: ReactNode;
  children: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <Surface
      as="section"
      background="raised"
      border="subtle"
      elevation="sm"
      radius="card"
      /* El mismo relleno y la misma separación que cualquier otra tarjeta del sitio: iba con `p-6`
         y márgenes propios en cada hijo (`mt-2`, `mt-4`) mientras la de una publicación usaba
         `p-5`. Ver `cardSpacing.ts`. */
      className={cn(CARD_PADDING, CARD_STACK, className)}
      data-testid={testId}
    >
      <h2 className="text-lg font-bold">{title}</h2>

      {intro ? <p className="text-sm text-text-support">{intro}</p> : null}

      <div>{children}</div>
    </Surface>
  );
}
