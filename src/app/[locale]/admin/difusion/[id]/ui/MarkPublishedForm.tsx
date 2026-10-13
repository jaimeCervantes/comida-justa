"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { type MarkPublishedState, markOutreachPublished } from "../actions";

/** Un grupo tal como lo necesita el formulario: lo que se lee ya viene escrito del servidor. */
export interface MarkableChannel {
  id: string;
  name: string;
  /** «Última vez aquí: hoy», ya traducido: la fecha se cuenta en el servidor, en hora de México. */
  lastPublished: string;
}

interface MarkPublishedFormProps {
  outreachTextId: string;
  /** El pan vendido suelto; nulo es la línea entera en grupos normales. */
  postId: string | null;
  channels: readonly MarkableChannel[];
  hint: string;
  submitLabel: string;
}

/**
 * Marca de una vez todos los grupos donde quedó publicada, incluidos los que se eligieron en el
 * selector «más grupos» de Facebook. Es lo único que escribe el historial: nada se marca solo.
 */
export default function MarkPublishedForm({
  outreachTextId,
  postId,
  channels,
  hint,
  submitLabel,
}: MarkPublishedFormProps) {
  const t = useTranslations("outreach");
  const [state, action, isPending] = useActionState<
    MarkPublishedState,
    FormData
  >(markOutreachPublished, {});

  return (
    <form action={action} data-testid="outreach-mark-published">
      <input type="hidden" name="outreachTextId" value={outreachTextId} />
      <input type="hidden" name="postId" value={postId ?? ""} />

      <p className="mb-2 text-sm text-text-support">{hint}</p>

      <ul className="mb-3 flex flex-col gap-2">
        {channels.map((channel) => (
          <li key={channel.id} data-testid="outreach-channel">
            <label className="flex cursor-pointer items-start gap-3 rounded-card border border-separator bg-surface-elevation-1 p-3 focus-within:ring-2 focus-within:ring-(--focus-ring)">
              <input
                type="checkbox"
                name="channelIds"
                value={channel.id}
                className="mt-1 size-5 accent-pw-green"
              />
              <span className="flex flex-col">
                <span className="font-semibold">{channel.name}</span>
                <span
                  data-testid="outreach-channel-last"
                  className="text-sm text-text-support"
                >
                  {channel.lastPublished}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      {state.error ? (
        <p role="alert" className="mb-2 text-sm text-brand-clay-700">
          {state.error}
        </p>
      ) : null}

      <Button
        type="submit"
        size="sm"
        isLoading={isPending}
        disabled={isPending}
        loadingLabel={t("saving")}
      >
        {submitLabel}
      </Button>
    </form>
  );
}
