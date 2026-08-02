/**
 * Los rastreadores de los asistentes, por su nombre.
 *
 * Se declaran uno a uno porque cada empresa usa varios y **no significan lo mismo**: uno indexa
 * para responder con cita, otro recolecta para entrenar y otro solo va a buscar la página que un
 * usuario acaba de pegar en el chat. Tenerlos escritos permite decidir por separado el día que
 * interese; hoy todos entran a lo público.
 *
 * Fuente: la documentación de cada empresa. Si aparece uno nuevo, se agrega aquí y `robots.txt`
 * lo recoge solo.
 */
export const AI_CRAWLERS: readonly string[] = [
  // OpenAI: entrenamiento, índice de búsqueda y visita a petición de un usuario.
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  // Anthropic.
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  // Perplexity.
  "PerplexityBot",
  "Perplexity-User",
  /* Google y Apple: **no** son sus rastreadores de búsqueda (Googlebot y Applebot ya entran por el
     grupo `*`), sino los interruptores de sus asistentes. Bloquearlos no quita el sitio del
     buscador; permitirlos es lo que deja que Gemini y Apple Intelligence lo citen. */
  "Google-Extended",
  "Applebot-Extended",
  // Meta, Amazon y Common Crawl, que alimenta a media industria.
  "meta-externalagent",
  "Amazonbot",
  "CCBot",
];
