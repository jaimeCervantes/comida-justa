"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import {
  OUTREACH_CHANNEL_FORMATS,
  type OutreachChannelFormat,
} from "~/domain/outreach/channelFormats";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Select } from "~/presentation/design_system/forms/Select";
import { TextArea } from "~/presentation/design_system/forms/TextArea";
import { TextField } from "~/presentation/design_system/forms/TextField";
import { ValidatedForm } from "~/presentation/forms/ValidatedForm";
import { type ChannelFormState, saveOutreachChannel } from "../actions";
import { CHANNEL_FORMAT_LABELS } from "../formatLabels";

export interface ChannelFormValues {
  name: string;
  url: string;
  format: OutreachChannelFormat;
  minDaysBetween: number;
  notes: string;
}

interface ChannelFormProps {
  /** El nombre accesible del formulario: el mismo encabezado que lo presenta. */
  label: string;
  /** Sin identidad da de alta; con ella corrige ese grupo. */
  id?: string;
  initial?: ChannelFormValues;
}

const EMPTY: ChannelFormValues = {
  name: "",
  url: "",
  format: "post",
  minDaysBetween: 7,
  notes: "",
};

/** Alta y corrección de un grupo donde se difunde. */
export default function ChannelForm({
  label,
  id,
  initial = EMPTY,
}: ChannelFormProps) {
  const t = useTranslations("outreach");
  const [state, action, isPending] = useActionState<ChannelFormState, FormData>(
    saveOutreachChannel,
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
        label={t("groupName")}
        defaultValue={initial.name}
        error={state.errors.name}
        containerClassName="mb-4"
      />

      {/* `text` y no `url`: el navegador rechazaría `facebook.com/groups/…` sin `https://`, que es
          como se copia muchas veces desde el teléfono. La dirección se completa al guardar. */}
      <TextField
        required
        name="url"
        type="text"
        inputMode="url"
        label={t("groupUrl")}
        hint={t("groupUrlHint")}
        defaultValue={initial.url}
        error={state.errors.url}
        containerClassName="mb-4"
      />

      <Select
        name="format"
        label={t("groupFormat")}
        hint={t("groupFormatHint")}
        defaultValue={initial.format}
        error={state.errors.format}
        containerClassName="mb-4"
      >
        {OUTREACH_CHANNEL_FORMATS.map((format) => (
          <option key={format} value={format}>
            {t(CHANNEL_FORMAT_LABELS[format])}
          </option>
        ))}
      </Select>

      <TextField
        required
        name="minDaysBetween"
        type="number"
        min={0}
        max={365}
        step={1}
        label={t("groupMinDays")}
        hint={t("groupMinDaysHint")}
        defaultValue={String(initial.minDaysBetween)}
        error={state.errors.minDaysBetween}
        containerClassName="mb-4 max-w-xs"
      />

      <TextArea
        name="notes"
        label={t("groupNotes")}
        hint={t("groupNotesHint")}
        defaultValue={initial.notes}
        maxLength={1000}
        rows={3}
        containerClassName="mb-6"
      />

      <Button
        type="submit"
        color="green"
        isLoading={isPending}
        disabled={isPending}
        loadingLabel={t("saving")}
      >
        {isPending ? t("saving") : t("saveGroup")}
      </Button>
    </ValidatedForm>
  );
}
