import { useFormatter } from "next-intl";

/**
 * La fecha de una publicación, en el idioma del sitio.
 *
 * Antes leía `navigator.language`, es decir el idioma del **navegador**, no el que el visitante
 * eligió: cambiar el sitio a English dejaba la fecha en español. Y como eso solo se puede saber en
 * el cliente, el componente se pintaba primero como un rectángulo gris animado y luego se
 * reemplazaba por la fecha, con el salto de maquetación correspondiente.
 *
 * Con el formateador de next-intl el idioma es el de la ruta, servidor y cliente coinciden —la
 * zona horaria está fijada en `src/i18n/request.ts`— y la fecha sale ya en el HTML. Se fue el
 * estado, el efecto y el parpadeo.
 */
export default function FormattedDateComponent({
  isoDateString,
}: {
  isoDateString: string;
}) {
  const format = useFormatter();

  if (!isoDateString) {
    return null;
  }

  const dateObject = new Date(isoDateString);

  if (Number.isNaN(dateObject.getTime())) {
    return null;
  }

  return (
    <time
      dateTime={isoDateString}
      className="relative inline-block first-letter:uppercase text-sm text-text-support"
    >
      {format.dateTime(dateObject, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
      })}
    </time>
  );
}
