import type { ReactNode } from "react";
import { cn } from "../styling/merge-class-names";
import { Heading } from "../typography/Heading";

/**
 * Lo que se ve cuando no hay nada que ver.
 *
 * La sección 06 del canvas de v2 lo dice en una línea: **un vacío siempre dice tres cosas —qué
 * falta, por qué está bien que falte, y qué hacer ahora**. Los treinta y tres vacíos del sitio
 * decían casi todos solo la primera, así que quien llegaba a un catálogo recién abierto leía «Aún
 * no hay productos ni servicios publicados» y se quedaba sin salida. Un callejón no es un estado
 * vacío: es una página rota que se disculpa.
 *
 * Las tres partes son props separadas y no un solo texto a propósito. Con una sola cadena, la
 * tentación es escribir las tres cosas en una frase larga, y la que siempre se cae al traducir es
 * la tercera — que es justo la única que sirve para algo.
 *
 * **No traduce nada.** Vive en el design system, así que tiene que poder pintarse fuera del árbol
 * de next-intl (`app/not-found.tsx` está fuera de `[locale]`). Los textos llegan hechos.
 */
export function EmptyState({
  title,
  children,
  action,
  testId,
  className,
}: {
  /** Qué falta. Es un encabezado de verdad: la sección se quedó sin contenido, no sin título. */
  title: ReactNode;
  /** Por qué está bien que falte, o qué esperar. */
  children?: ReactNode;
  /** Qué hacer ahora. Un enlace o un botón, ya armado por quien llama. */
  action?: ReactNode;
  testId?: string;
  className?: string;
}) {
  return (
    <div
      data-testid={testId}
      className={cn(
        "flex flex-col items-start gap-3 rounded-card border border-separator bg-surface-elevation-1 px-6 py-8",
        className,
      )}
    >
      <Heading level={2} size="xs">
        {title}
      </Heading>

      {children ? (
        <p className="max-w-prose text-body text-text-support text-pretty">
          {children}
        </p>
      ) : null}

      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
