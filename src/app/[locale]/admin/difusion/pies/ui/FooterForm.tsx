"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import { type FooterFormState, saveOutreachFooter } from "../actions";

interface FooterFormProps {
  /** El nombre accesible del formulario: el mismo encabezado que lo presenta. */
  label: string;
  /** Sin identidad da de alta; con ella corrige ese pie. */
  id?: string;
  initial?: { name: string; body: string };
}

/** Alta y corrección de un pie compartido. */
export default function FooterForm({
  label,
  id,
  initial = { name: "", body: "" },
}: FooterFormProps) {
  const t = useTranslations("outreach");
  const [state, action, isPending] = useActionState<FooterFormState, FormData>(
    saveOutreachFooter,
    { errors: {} },
  );

  return (
    <ValidatedForm action={action} aria-label={label} className="max-w-xl">
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

      <TextField
        required
        name="name"
        label={t("footerName")}
        hint={t("footerNameHint")}
        defaultValue={initial.name}
        error={state.errors.name}
        containerClassName="mb-4"
      />

      <TextArea
        required
        name="body"
        label={t("footerBody")}
        hint={t("footerBodyHint")}
        defaultValue={initial.body}
        error={state.errors.body}
        maxLength={2000}
        rows={6}
        containerClassName="mb-6"
      />

      <Button
        type="submit"
        color="green"
        isLoading={isPending}
        disabled={isPending}
        loadingLabel={t("saving")}
      >
        {isPending ? t("saving") : t("saveFooter")}
      </Button>
    </ValidatedForm>
  );
}
