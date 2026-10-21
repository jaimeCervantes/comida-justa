"use client";
import { useTranslations } from "next-intl";
import { MdOutlinePriceChange } from "react-icons/md";
import { formatDateTimeLocalInTimeZone } from "~/domain/schedule/localDateTime";
import { SITE_CURRENCY } from "~/infra/constants";
import { TextField } from "~/presentation/design_system/forms/TextField";
import EventTimeZoneField from "~/presentation/post/EventTimeZone/EventTimeZoneField";

/**
 * El precio de promoción y cuándo termina, iguales al publicar y al editar.
 *
 * Solo se monta en lo que se cobra —producto o servicio—: un evento tiene precio, pero no pasa por
 * el carrito, así que una rebaja ahí no tendría dónde aplicarse. La regla vive en
 * `domain/entities/post/promotion.ts`; aquí solo se pregunta.
 */
export default function SalePriceFields({
  timeZone,
  salePrice,
  saleEndsAt,
  errors,
  sendsTimeZone = true,
}: {
  timeZone: string;
  salePrice?: number | null;
  saleEndsAt?: Date | string | null;
  errors?: { salePrice?: string | null; saleEndsAt?: string | null };
  /**
   * La hora de fin se escribe en la zona de quien publica, como la de un evento. Va en `false`
   * donde el formulario ya manda su zona, para no repetir el campo.
   */
  sendsTimeZone?: boolean;
}) {
  const t = useTranslations("publish");

  return (
    <fieldset
      data-testid="sale-price-fields"
      className="mb-6 grid gap-x-4 sm:grid-cols-2"
    >
      {sendsTimeZone ? <EventTimeZoneField timeZone={timeZone} /> : null}
      <TextField
        name="salePrice"
        type="number"
        inputMode="numeric"
        label={t("salePrice")}
        defaultValue={salePrice ?? ""}
        icon={<MdOutlinePriceChange />}
        trailingAdornment={
          <span className="text-label text-text-support">{SITE_CURRENCY}</span>
        }
        min="1"
        step="1"
        error={errors?.salePrice}
      />
      <TextField
        key={`saleEndsAt-${timeZone}`}
        name="saleEndsAt"
        type="datetime-local"
        label={t("saleEndsAt")}
        defaultValue={formatDateTimeLocalInTimeZone(saleEndsAt, timeZone)}
        error={errors?.saleEndsAt}
      />
      <p className="text-label text-text-support sm:col-span-2">
        {t("saleHint")}
      </p>
    </fieldset>
  );
}
