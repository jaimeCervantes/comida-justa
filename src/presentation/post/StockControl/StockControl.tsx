"use client";
import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { canTrackStock } from "~/domain/entities/post/stock";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Form } from "~/presentation/design_system/forms/Form";
import { TextField } from "~/presentation/design_system/forms/TextField";
import type { StockState } from "~/presentation/post/stockAction";
import type { SetPostStockError } from "~/use_cases/managePost/setPostStockUseCase";

/**
 * La clave de catálogo que le toca a cada código del caso de uso.
 *
 * Es un `Record` cerrado y no un `t(\`stockError.${code}\`)`: una clave compuesta en tiempo de
 * ejecución no se encuentra con grep, y añadir un error nuevo tiene que romper el `typecheck` en
 * vez de pintar la clave cruda en pantalla.
 */
const ERROR_KEYS = {
  "not-allowed": "stockErrorNotAllowed",
  "not-trackable": "stockErrorNotTrackable",
  "invalid-stock": "stockErrorInvalidStock",
} as const satisfies Record<SetPostStockError, string>;

/**
 * El campo con el que quien vende dice cuántas unidades le quedan.
 *
 * Sólo aparece en un `producto`: es lo único que se entrega contado en piezas. Ocultarlo en lo
 * demás es cortesía, no seguridad — quien decide es el servidor, que vuelve a preguntárselo al
 * dominio antes de escribir.
 *
 * El campo nace **vacío** cuando la publicación no lleva inventario, y ese vacío es información:
 * dice "nadie está contando esto todavía", que no es lo mismo que un cero. Escribir el primer
 * número es lo que la pone a contar, y desde entonces `is_available` deja de decidirse a mano.
 *
 * El navegador y el servidor comparten frase para la misma regla (`stockErrorInvalidStock`): el
 * `min`/`step` del campo rechaza antes de enviar y la acción vuelve a comprobarlo, pero quien lo
 * lee ve una sola voz. Es la propiedad que documenta `usePostValidationMessages`.
 */
export default function StockControl({
  action,
  postId,
  slug,
  kind,
  stockQuantity,
  compact = false,
}: {
  action: (state: StockState, data: FormData) => Promise<StockState>;
  postId: string;
  slug: string;
  kind?: string | null;
  /** Lo guardado. `null` = no lleva inventario. */
  stockQuantity: number | null;
  /**
   * En un renglón de tabla, no en una ficha.
   *
   * Cambia la forma, **no la conducta**: el mismo campo, la misma validación y la misma acción. La
   * columna ya rotula, así que repetir «Existencias» en cada renglón sería decir 418 veces lo que
   * la cabecera dice una — pero el rótulo sigue estando, como `aria-label`, porque un lector de
   * pantalla no ve la columna.
   */
  compact?: boolean;
}) {
  const t = useTranslations("post");
  const [state, stockAction, isPending] = useActionState<StockState, FormData>(
    action,
    {},
  );

  if (!canTrackStock({ kind })) return null;

  const saved = state.stockQuantity ?? stockQuantity;
  const invalid = t("stockErrorInvalidStock");
  const label = t("stockLabel");

  return (
    /* `Form` y no un `<form>` pelado: apaga el globito del navegador —que sale en el idioma del
       navegador y no en el de la ruta— y a cambio revela de golpe lo que dicen los campos, ya
       traducido, cuando un envío se cancela. */
    <Form
      action={stockAction}
      messages={{
        badInput: invalid,
        rangeUnderflow: invalid,
        stepMismatch: invalid,
      }}
      serverErrorSignal={state.error}
      data-testid="stock-control"
      className={
        compact ? "flex items-start gap-2" : "flex flex-col items-start gap-2"
      }
    >
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />

      <TextField
        /* React reinicia el formulario al terminar la acción, y un `defaultValue` nuevo no llega a
           un nodo que ya existe: sin la `key`, guardar 12 dejaría el campo con lo que había antes. */
        key={String(saved)}
        name="stockQuantity"
        type="number"
        min={0}
        step={1}
        inputMode="numeric"
        label={compact ? undefined : label}
        aria-label={compact ? label : undefined}
        hint={compact ? undefined : t("stockHelp")}
        error={state.error ? t(ERROR_KEYS[state.error]) : null}
        defaultValue={saved ?? ""}
        containerClassName={compact ? "w-24" : "w-48"}
        data-testid="stock-input"
      />

      <Button
        type="submit"
        size="sm"
        isLoading={isPending}
        disabled={isPending}
      >
        {t("stockSave")}
      </Button>
    </Form>
  );
}
