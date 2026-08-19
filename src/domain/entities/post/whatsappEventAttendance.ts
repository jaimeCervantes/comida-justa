import { whatsappLink } from "~/domain/shared/whatsappLink";

export interface WhatsappEventAttendanceLabels {
  /** Encabeza el mensaje. Ej.: "Hola, quiero asistir a este evento:" */
  intro: string;
  /** Etiqueta del horario. Ej.: "Horario" */
  when: string;
}

export interface WhatsappEventAttendanceRequest {
  title: string;
  /** Horario ya formateado en el idioma de quien lee. */
  when: string;
  /** Enlace absoluto a la publicacion. */
  url: string;
  labels: WhatsappEventAttendanceLabels;
  whatsapp?: string | null;
  phone?: string | null;
}

export function buildWhatsappEventAttendanceMessage(
  request: Pick<WhatsappEventAttendanceRequest, "title" | "when" | "url">,
  labels: WhatsappEventAttendanceLabels,
): string {
  return `${labels.intro}\n\n${request.title}\n${labels.when}: ${request.when}\n${request.url}`;
}

/** El enlace para avisar asistencia, o `null` cuando no hay numero utilizable. */
export function buildWhatsappEventAttendanceLink({
  title,
  when,
  url,
  labels,
  whatsapp,
  phone,
}: WhatsappEventAttendanceRequest): string | null {
  return whatsappLink(
    whatsapp || phone,
    buildWhatsappEventAttendanceMessage({ title, when, url }, labels),
  );
}
