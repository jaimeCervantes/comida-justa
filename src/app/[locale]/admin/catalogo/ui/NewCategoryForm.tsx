"use client";
import { useTranslations } from "next-intl";

import { useActionState } from "react";
import type { CategoryOption } from "~/domain/entities/post/taxonomy";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Select } from "~/presentation/design_system/forms/Select";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import { type CatalogActionState, createCategory } from "../actions";

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
  const t = useTranslations("admin");
  const [state, action, isPending] = useActionState<
    CatalogActionState,
    FormData
  >(createCategory, { errors: {} });

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3">{t("addCategoryHeading")}</h2>

      {state.created ? (
        <p
          data-testid="catalogo-creada"
          role="status"
          className="mb-3 text-pw-green"
        >
          {t("categoryCreated", { key: state.created })}
        </p>
      ) : null}

      {state.errors.form ? (
        <p data-testid="catalogo-error" className="mb-3 text-brand-clay-700">
          {state.errors.form}
        </p>
      ) : null}

      <ValidatedForm
        action={action}
        aria-label={t("addCategoryHeading")}
        className="max-w-md"
      >
        <Select
          id="parentKey"
          name="parentKey"
          label={t("parentCategory")}
          defaultValue={roots[0]?.value ?? ""}
          error={state.errors.parentKey}
          containerClassName="mb-4"
        >
          <option value="">{t("newRootCategory")}</option>
          {roots.map((root) => (
            <option key={root.value} value={root.value}>
              {root.label}
            </option>
          ))}
        </Select>

        <TextField
          required
          name="key"
          type="text"
          label={t("categoryKey")}
          placeholder={t("categoryKeyPlaceholder")}
          error={state.errors.key}
          containerClassName="mb-4"
        />

        <TextField
          required
          name="labelEs"
          type="text"
          label={t("spanishLabel")}
          placeholder={t("spanishLabelPlaceholder")}
          error={state.errors.labelEs}
          containerClassName="mb-4"
        />

        {/* Sin inglés la etiqueta cae al español; se ve peor, pero no rompe nada. */}
        <TextField
          name="labelEn"
          type="text"
          label={t("englishLabel")}
          placeholder="Preserves"
          containerClassName="mb-4"
        />

        <Button
          type="submit"
          color="green"
          isLoading={isPending}
          disabled={isPending}
        >
          {isPending ? t("categorySubmitting") : t("categorySubmit")}
        </Button>
      </ValidatedForm>
    </section>
  );
}
