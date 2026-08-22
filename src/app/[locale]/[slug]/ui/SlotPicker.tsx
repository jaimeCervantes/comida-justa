"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Link } from "~/i18n/navigation";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { bookSlot } from "../bookActions";

export type OfferedSlot = {
  /** ISO, que es como viaja del servidor al cliente y de vuelta a la acción. */
  startsAt: string;
  endsAt: string;
};

type Props = {
  postId: string;
  sellerId: string;
  title: string;
  unitPrice: number;
  durationMinutes: number;
  slots: readonly OfferedSlot[];
};

/**
 * Elegir hora para un servicio.
 *
 * Los huecos llegan **calculados del servidor**: el cliente no sabe el horario del proveedor ni sus
 * ausencias, y no debería — lo único que hace aquí es elegir uno y mandarlo.
 *
 * Y aun así lo que manda se vuelve a validar en la acción, y después en la base. Tres capas para lo
 * mismo suena a exceso hasta que se mira qué atrapa cada una: aquí, que no se pueda elegir lo que no
 * se ofrece; en la acción, un formulario manipulado; en la base, la carrera entre dos personas
 * pulsando el mismo hueco a la vez, que ninguna comprobación previa puede ganar.
 */
export default function SlotPicker({
  postId,
  sellerId,
  title,
  unitPrice,
  durationMinutes,
  slots,
}: Props) {
  const t = useTranslations("post");
  const format = useFormatter();
  const [state, action, pending] = useActionState(bookSlot, {});

  if (state.booked) {
    return (
      <div className="mt-6 text-sm" data-testid="book-done">
        <p className="font-medium text-pw-green">{t("bookDone")}</p>
        <p className="mt-1 text-text-support">
          {t("bookDoneHelp")}{" "}
          <Link
            href={{ pathname: "/pedidos", query: { vista: "placed" } }}
            data-testid="book-orders-link"
            className="font-medium text-pw-green underline"
          >
            {t("bookOrdersLink")}
          </Link>
        </p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <p className="mt-6 text-sm text-text-support" data-testid="book-no-slots">
        {t("bookNoSlots")}
      </p>
    );
  }

  return (
    <form action={action} className="mt-6" data-testid="slot-picker">
      <Heading level={2} size="xs" className="mb-2">
        {t("bookHeading")}
      </Heading>

      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="sellerId" value={sellerId} />
      <input type="hidden" name="title" value={title} />
      <input type="hidden" name="unitPrice" value={unitPrice} />
      <input type="hidden" name="durationMinutes" value={durationMinutes} />

      <div className="flex flex-wrap items-center gap-2">
        <select
          name="startsAt"
          required
          data-testid="slot-select"
          className="border rounded px-2 py-1 bg-transparent"
          onChange={(event) => {
            /* El fin viaja aparte para que la acción no tenga que recalcularlo y arriesgarse a
               discrepar de lo que se ofreció. Se mantiene en pareja con el inicio elegido. */
            const chosen = slots.find((s) => s.startsAt === event.target.value);
            const hidden = event.currentTarget.form?.elements.namedItem(
              "endsAt",
            ) as HTMLInputElement | null;

            if (hidden && chosen) hidden.value = chosen.endsAt;
          }}
        >
          {slots.map((slot) => (
            <option key={slot.startsAt} value={slot.startsAt}>
              {format.dateTime(new Date(slot.startsAt), {
                weekday: "long",
                day: "numeric",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </option>
          ))}
        </select>
        <input type="hidden" name="endsAt" defaultValue={slots[0]?.endsAt} />

        <button
          type="submit"
          disabled={pending}
          data-testid="book-submit"
          className="rounded bg-pw-green px-4 py-2 text-white disabled:opacity-50"
        >
          {t("bookSubmit")}
        </button>
      </div>

      {state.error === "slot-taken" ? (
        <p
          className="mt-2 text-sm text-feedback-error"
          data-testid="book-taken"
        >
          {t("bookSlotTaken")}
        </p>
      ) : null}
      {state.error === "not-offered" ? (
        <p className="mt-2 text-sm text-feedback-error" data-testid="book-gone">
          {t("bookNotOffered")}
        </p>
      ) : null}
      {state.error === "no-session" ? (
        <p
          className="mt-2 text-sm text-feedback-error"
          data-testid="book-no-session"
        >
          {t("bookNoSession")}
        </p>
      ) : null}
    </form>
  );
}
