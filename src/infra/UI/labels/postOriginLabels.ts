import { POST_ORIGINS, type PostOrigin } from "~/domain/entities/post/origin";

/** Etiqueta visible de cada `origin`. La allowlist vive en el dominio; aquí solo se nombra. */
export const ORIGIN_LABELS: Record<PostOrigin, string> = {
  hazlo_sano_propio: "Hazlo Sano — propio",
  hazlo_sano_reventa: "Hazlo Sano — reventa",
  productor_local: "Productor local",
  reventa_local: "Reventa local",
  productor_foraneo: "Productor foráneo",
  reventa_foranea: "Reventa foránea",
};

export const UNSPECIFIED_ORIGIN_LABEL = "Sin especificar";

export function originLabel(origin: PostOrigin | null): string {
  return origin ? ORIGIN_LABELS[origin] : UNSPECIFIED_ORIGIN_LABEL;
}

/** Opciones del selector de procedencia, en el orden canónico de la allowlist. */
export const ORIGIN_OPTIONS: ReadonlyArray<{
  value: PostOrigin;
  label: string;
}> = POST_ORIGINS.map((value) => ({ value, label: ORIGIN_LABELS[value] }));
