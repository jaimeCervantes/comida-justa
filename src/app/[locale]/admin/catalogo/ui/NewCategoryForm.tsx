"use client";

import { useActionState } from "react";
import Button from "~/infra/UI/components/Button";
import TextField from "~/infra/UI/components/TextField";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { createCategory, type CatalogActionState } from "../actions";

const selectClassName =
  "w-full rounded border border-gray-300 bg-white px-3 py-2 text-black dark:bg-gray-800 dark:text-white";

interface NewCategoryFormProps {
  /** Las raíces del catálogo, para colgar la nueva sub-categoría de una de ellas. */
  roots: readonly CategoryOption[];
}

/**
 * Alta de una categoría.
 *
 * Es lo que hace que agregar una categoría deje de ser una migración: se guarda, se invalida el
 * caché y aparece en `/publicar` sin desplegar nada.
 */
export default function NewCategoryForm({ roots }: NewCategoryFormProps) {
  const [state, action, isPending] = useActionState<CatalogActionState, FormData>(
    createCategory,
    { errors: {} },
  );

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">Agregar categoría</h2>

      {state.created ? (
        <p data-testid="catalogo-creada" role="status" className="mb-3 text-pw-green">
          Se agregó «{state.created}». Ya se puede elegir al publicar.
        </p>
      ) : null}

      {state.errors.form ? (
        <p data-testid="catalogo-error" className="mb-3 text-red-700 dark:text-red-400">
          {state.errors.form}
        </p>
      ) : null}

      <form action={action} className="max-w-md">
        <div className="mb-4 text-black dark:text-white">
          <label htmlFor="parentKey" className="block mb-1">
            Cuelga de:
          </label>
          <select
            id="parentKey"
            name="parentKey"
            defaultValue={roots[0]?.value ?? ""}
            className={selectClassName}
          >
            <option value="">— Nueva categoría raíz —</option>
            {roots.map((root) => (
              <option key={root.value} value={root.value}>
                {root.label}
              </option>
            ))}
          </select>
          {state.errors.parentKey ? (
            <p className="pt-1 text-red-700 dark:text-red-400">{state.errors.parentKey}</p>
          ) : null}
        </div>

        <TextField
          required
          name="key"
          type="text"
          label="Clave (así se guarda):"
          placeholder="conservas"
          error={state.errors.key}
          containerClassName="mb-4"
        />

        <TextField
          required
          name="labelEs"
          type="text"
          label="Etiqueta en español:"
          placeholder="Conservas"
          error={state.errors.labelEs}
          containerClassName="mb-4"
        />

        {/* Sin inglés la etiqueta cae al español; se ve peor, pero no rompe nada. */}
        <TextField
          name="labelEn"
          type="text"
          label="Etiqueta en inglés (opcional):"
          placeholder="Preserves"
          containerClassName="mb-4"
        />

        <Button type="submit" color="green" isLoading={isPending} disabled={isPending}>
          {isPending ? "Guardando..." : "Agregar"}
        </Button>
      </form>
    </section>
  );
}
