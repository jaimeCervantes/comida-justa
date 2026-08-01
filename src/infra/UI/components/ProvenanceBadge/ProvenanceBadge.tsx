import { useTranslations } from "next-intl";
import {
  isHazloSanoOrigin,
  isLocalOrigin,
} from "~/domain/entities/post/origin";

type ProvenanceBadgeProps = {
  origin: string | null | undefined;
  className?: string;
};

/** La clave de la insignia según el `origin`. `null` cuando no aplica ninguna. */
function badgeKey(
  origin: string | null | undefined,
): "provenance.hazloSano" | "provenance.local" | null {
  if (isHazloSanoOrigin(origin)) return "provenance.hazloSano";
  if (isLocalOrigin(origin)) return "provenance.local";
  return null;
}

export default function ProvenanceBadge({
  origin,
  className = "",
}: ProvenanceBadgeProps) {
  const t = useTranslations("vocabulary");
  const key = badgeKey(origin);

  if (!key) return null;

  return (
    <span
      data-testid="provenance-badge"
      className={`inline-flex items-center gap-1 rounded-full bg-pw-lightgreen/15 px-3 py-1 text-sm font-semibold text-pw-green ${className}`}
    >
      {t(key)}
    </span>
  );
}
