"use client";
import { useTranslations } from "next-intl";
import { MdOutlineSell } from "react-icons/md";
import { BRAND_MAX_LENGTH } from "~/domain/entities/post/brand";
import { TextField } from "~/presentation/design_system/forms/TextField";

/**
 * La marca de lo que se vende, igual al publicar y al editar. Opcional: lo normal en lo que publica
 * un vecino es no tener marca. Con ella, sus ofertas se agrupan en su propio slide del carrusel del
 * inicio. La regla vive en `domain/entities/post/brand.ts`; aquí solo se pregunta.
 */
export default function BrandField({
  brand,
  error,
}: {
  brand?: string | null;
  error?: string | null;
}) {
  const t = useTranslations("publish");

  return (
    <TextField
      name="brand"
      label={t("brand")}
      defaultValue={brand ?? ""}
      icon={<MdOutlineSell />}
      maxLength={BRAND_MAX_LENGTH}
      autoComplete="off"
      error={error}
    />
  );
}
