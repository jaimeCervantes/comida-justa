"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Select } from "~/presentation/design_system/forms/Select";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import type { OutreachProductOption } from "~/use_cases/outreach/ports/IOutreachProductCatalog";
import { type OutreachFormState, saveOutreachText } from "../actions";
import OpeningVersions from "./OpeningVersions";
import OutreachItemRow, { type OutreachFormItem } from "./OutreachItemRow";
import ProductPicker from "./ProductPicker";

/**
 * Lo que cabe alrededor de la lista. El texto de masa madre de hoy ronda los 500 caracteres; el
 * tope evita pegar por error una página entera, no recortar lo que se escribe a propósito.
 */
const TEXT_MAX_LENGTH = 5000;

export interface OutreachTextFormValues {
  name: string;
  opening: string;
  /** Las otras versiones de lo que va antes de la lista, de la 2 en adelante. */
  versions: string[];
  closing: string;
  footerId: string | null;
  items: OutreachFormItem[];
}

/** Un pie que se puede elegir: con su nombre basta. */
export interface FooterOption {
  id: string;
  name: string;
}

interface OutreachTextFormProps {
  /** El nombre accesible del formulario: el mismo encabezado que lo presenta. */
  label: string;
  /** Sin identidad, el formulario crea; con ella, reemplaza ese texto. */
  id?: string;
  initial?: OutreachTextFormValues;
  products: readonly OutreachProductOption[];
  footers: readonly FooterOption[];
}

const EMPTY: OutreachTextFormValues = {
  name: "",
  opening: "",
  versions: [],
  closing: "",
  footerId: null,
  items: [],
};

/**
 * Alta y edición de un texto de difusión.
 *
 * Los productos se manejan en el navegador y viajan como JSON en un campo oculto, porque su orden
 * **es** el dato: de él sale el orden de las etiquetas dentro de cada renglón de la lista.
 */
export default function OutreachTextForm({
  label,
  id,
  initial = EMPTY,
  products,
  footers,
}: OutreachTextFormProps) {
  const t = useTranslations("outreach");
  const [state, action, isPending] = useActionState<
    OutreachFormState,
    FormData
  >(saveOutreachText, { errors: {} });
  const [items, setItems] = useState<OutreachFormItem[]>(initial.items);

  const addedIds = new Set(items.map((item) => item.postId));
  // Un texto nuevo arranca con el pie si solo hay uno: es el caso de casi siempre.
  const defaultFooterId =
    initial.footerId ?? (!id && footers.length === 1 ? footers[0].id : "");

  // La etiqueta arranca con el título entero: así nunca nace vacía, y acortarla es borrar.
  const add = (product: OutreachProductOption): void =>
    setItems((current) => [
      ...current,
      {
        postId: product.postId,
        title: product.title,
        label: product.title,
        emoji: "",
      },
    ]);

  const change = (
    index: number,
    changes: Partial<Pick<OutreachFormItem, "label" | "emoji">>,
  ): void =>
    setItems((current) =>
      current.map((item, at) =>
        at === index ? { ...item, ...changes } : item,
      ),
    );

  const move = (index: number, offset: -1 | 1): void =>
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(index + offset, 0, moved);
      return next;
    });

  const remove = (index: number): void =>
    setItems((current) => current.filter((_, at) => at !== index));

  return (
    <ValidatedForm action={action} aria-label={label}>
      {state.errors.form ? (
        <p
          data-testid="outreach-form-error"
          role="alert"
          className="mb-4 text-brand-clay-700"
        >
          {state.errors.form}
        </p>
      ) : null}

      {id ? <input type="hidden" name="id" value={id} /> : null}
      <input
        type="hidden"
        name="items"
        value={JSON.stringify(
          items.map((item) => ({
            postId: item.postId,
            label: item.label,
            emoji: item.emoji,
          })),
        )}
      />

      <TextField
        required
        name="name"
        label={t("nameLabel")}
        hint={t("nameHint")}
        defaultValue={initial.name}
        error={state.errors.name}
        containerClassName="mb-4 max-w-md"
      />

      <TextArea
        name="opening"
        label={t("openingLabel")}
        hint={t("openingHint")}
        defaultValue={initial.opening}
        maxLength={TEXT_MAX_LENGTH}
        rows={8}
        containerClassName="mb-4"
      />

      <OpeningVersions initial={initial.versions} maxLength={TEXT_MAX_LENGTH} />

      <section className="mb-4">
        <Heading level={2} className="mb-1">
          {t("productsHeading")}
        </Heading>
        <p className="mb-3 text-sm text-text-support">{t("productsHint")}</p>

        <ProductPicker products={products} addedIds={addedIds} onAdd={add} />

        {items.length === 0 ? (
          <p className="text-sm text-text-support">{t("noProductsYet")}</p>
        ) : (
          <ol data-testid="outreach-items" className="flex flex-col gap-2">
            {items.map((item, index) => (
              <OutreachItemRow
                key={item.postId}
                item={item}
                isFirst={index === 0}
                isLast={index === items.length - 1}
                error={state.errors.items?.[index]}
                onChange={(changes) => change(index, changes)}
                onMove={(offset) => move(index, offset)}
                onRemove={() => remove(index)}
              />
            ))}
          </ol>
        )}
      </section>

      <TextArea
        name="closing"
        label={t("closingLabel")}
        hint={t("closingHint")}
        defaultValue={initial.closing}
        maxLength={TEXT_MAX_LENGTH}
        rows={5}
        containerClassName="mb-4"
      />

      <Select
        name="footerId"
        label={t("footerLabel")}
        hint={t("footerHint")}
        defaultValue={defaultFooterId}
        containerClassName="mb-6 max-w-md"
      >
        <option value="">{t("footerNone")}</option>
        {footers.map((footer) => (
          <option key={footer.id} value={footer.id}>
            {footer.name}
          </option>
        ))}
      </Select>

      <Button
        type="submit"
        color="green"
        isLoading={isPending}
        disabled={isPending}
        loadingLabel={t("saving")}
      >
        {isPending ? t("saving") : t("save")}
      </Button>
    </ValidatedForm>
  );
}
