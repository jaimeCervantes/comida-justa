/**
 * Los tres pasos de `/publicar`, y qué campo pertenece a cada uno.
 *
 * Es la pantalla 5.3 del canvas de v2. El asistente había quedado **fuera por acuerdo** cuando se
 * cerró v2 —el slice 13 solo repintó el formulario— y entra ahora por petición explícita.
 *
 * **El mapa vive en datos y no dentro del componente**, por lo mismo que `menuItems.ts` y
 * `bottomNavTabs.ts`: es una regla, se prueba sin navegador, y hay un sitio único donde mirar
 * cuando alguien añade un campo. Y hace falta de verdad, no por gusto: cuando el servidor rechaza
 * un campo —o la validación del navegador encuentra uno inválido— **hay que saltar al paso que lo
 * contiene** antes de enfocarlo. Sin eso, quien publica se queda mirando un error que está en otra
 * pantalla del asistente, que es peor que no tener asistente.
 *
 * El reparto no copia el del canvas al pie de la letra —el suyo tiene cuatro campos y este
 * formulario tiene doce—: sigue las tres preguntas que alguien se hace al publicar, y **coincide
 * con el orden en que los campos ya estaban escritos**, así que envolverlos no obligó a reordenar
 * una sola línea de JSX. Cuando el reparto natural y el orden del archivo coinciden, suele ser
 * señal de que el reparto es el bueno.
 */
export type PublishStepId = "essentials" | "details" | "contact";

export interface PublishStep {
  id: PublishStepId;
  /** Clave del catálogo `publish` con el nombre del paso. Escrita entera: se puede grepear. */
  labelKey: "stepEssentials" | "stepDetails" | "stepContact";
  /** Los `name` de los controles que viven en él. */
  fields: readonly string[];
}

export const PUBLISH_STEPS: readonly PublishStep[] = [
  {
    /** Qué es y cómo se llama. */
    id: "essentials",
    labelKey: "stepEssentials",
    fields: ["title", "kind", "category", "subCategory"],
  },
  {
    /** De dónde viene, cuándo ocurre, cuánto dura y cuánto cuesta. */
    id: "details",
    labelKey: "stepDetails",
    fields: [
      "origin",
      "startsAt",
      "endsAt",
      "route",
      "durationMinutes",
      "price",
    ],
  },
  {
    /** Cómo se ve, qué dice de sí mismo y cómo te encuentran. */
    id: "contact",
    labelKey: "stepContact",
    fields: ["media", "phone", "content"],
  },
];

/** Qué paso contiene un campo, o `null` si no lo declara ninguno. */
export function stepForField(name: string): PublishStepId | null {
  return PUBLISH_STEPS.find((step) => step.fields.includes(name))?.id ?? null;
}

/** La posición de un paso, para pintar «paso N de 3» y decidir a cuál se retrocede. */
export function indexOfStep(id: PublishStepId): number {
  return PUBLISH_STEPS.findIndex((step) => step.id === id);
}

/**
 * El primer paso que contiene alguno de estos campos.
 *
 * Se usa con los nombres que el servidor rechazó y con el primer control inválido del navegador:
 * en los dos casos la pregunta es la misma —«¿a dónde tengo que llevar a esta persona para que vea
 * lo que está mal?»— y la respuesta es el paso **más temprano**, porque un error de arriba suele
 * ser la causa de los de abajo.
 */
export function firstStepWithAnyField(
  names: readonly string[],
): PublishStepId | null {
  return (
    PUBLISH_STEPS.find((step) =>
      names.some((name) => step.fields.includes(name)),
    )?.id ?? null
  );
}
