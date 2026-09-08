import type { CycleRecognition } from "./habitChallenge";

/**
 * Si marcar el día del ritual deja publicación.
 *
 * `duplicate` es el único reconocimiento que no guarda una repetición nueva: el día ya estaba
 * contado y el panel responde «esa elección ya cuenta». Publicar ahí daría dos publicaciones del
 * mismo día a quien llegue por un camino que no sea el panel, que ya retira la fecha en cuanto la
 * cuenta.
 */
export function publishesRitualPractice(
  recognition: CycleRecognition,
): boolean {
  return recognition !== "duplicate";
}
