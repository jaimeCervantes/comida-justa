"use client";

import { useTranslations } from "next-intl";
import { type ReactNode, useActionState } from "react";
import { Button } from "~/presentation/design_system/buttons/Button";
import { type MarkPublishedState, markOutreachPublished } from "../actions";

/** Un grupo tal como lo necesita el formulario: lo que se lee ya viene escrito del servidor. */
export interface MarkableChannel {
  id: string;
  name: string;
  /** «Última vez aquí: hoy», ya traducido: la fecha se cuenta en el servidor, en hora de México. */
  lastPublished: string;
  /**
   * Lo que hace falta para publicar ahí —enlace, turno, reglas—, ya pintado en el servidor. En
   * grupos normales va en el mismo renglón que la casilla: un grupo, un renglón.
   */
  details?: ReactNode;
}

interface MarkPublishedFormProps {
  outreachTextId: string;
  /** El pan vendido suelto; nulo es la línea entera en grupos normales. */
  postId: string | null;
  channels: readonly MarkableChannel[];
  /** Sin él, lo explica quien envuelve el formulario (el paso 2 de grupos normales). */
  hint?: string;
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

      {hint ? <p className="mb-2 text-sm text-text-support">{hint}</p> : null}

      <ul className="mb-3 flex flex-col gap-2">
        {channels.map((channel) => (
          <li
            key={channel.id}
            data-testid="outreach-channel"
            className="rounded-card border border-separator bg-surface-elevation-1 p-3 focus-within:ring-2 focus-within:ring-(--focus-ring)"
          >
            <label className="flex cursor-pointer items-start gap-3">
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
            {channel.details ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 pl-8">
                {channel.details}
              </div>
            ) : null}
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
