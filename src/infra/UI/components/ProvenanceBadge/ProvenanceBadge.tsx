import {
  isHazloSanoOrigin,
  isLocalOrigin,
} from "~/domain/entities/post/origin";

type ProvenanceBadgeProps = {
  origin: string | null | undefined;
  className?: string;
};

/** Etiqueta visible derivada del `origin` de un post. No renderiza nada si no aplica. */
function badgeLabel(origin: string | null | undefined): string | null {
  if (isHazloSanoOrigin(origin)) return "🌿 Hazlo Sano";
  if (isLocalOrigin(origin)) return "📍 Local";
  return null;
}

export default function ProvenanceBadge({
  origin,
  className = "",
}: ProvenanceBadgeProps) {
  const label = badgeLabel(origin);

  if (!label) return null;

  return (
    <span
      data-testid="provenance-badge"
      className={`inline-flex items-center gap-1 rounded-full bg-pw-lightgreen/15 px-3 py-1 text-sm font-semibold text-pw-green ${className}`}
    >
      {label}
    </span>
  );
}
