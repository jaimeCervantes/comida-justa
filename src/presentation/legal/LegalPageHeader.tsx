import { Heading } from "~/presentation/design_system/typography/Heading";
import { Text } from "~/presentation/design_system/typography/Text";

/**
 * La cabecera de una página legal: título, subtítulo y fecha de última actualización.
 *
 * Estaba escrita dos veces, carácter por carácter, en `/condiciones-de-servicio` y
 * `/politica-de-privacidad`, con la escala tipográfica y la pareja `text-zinc-* dark:text-zinc-*`
 * copiadas a mano en cada una.
 */
export default function LegalPageHeader({
  title,
  subtitle,
  lastUpdate,
}: {
  title: string;
  subtitle: string;
  /** Ya formateada por quien la pinta: la fecha depende del idioma de la ruta. */
  lastUpdate: string;
}) {
  return (
    <header className="mb-8 md:mb-12 border-b border-separator pb-6 md:pb-8">
      <Heading
        level={1}
        className="text-2xl sm:text-4xl md:text-5xl mb-3 sm:mb-4"
      >
        {title}
      </Heading>
      <Text
        variant="lead"
        tone="support"
        weight="medium"
        className="sm:text-xl mb-1 sm:mb-2"
      >
        {subtitle}
      </Text>
      <Text variant="caption" tone="support" className="font-mono">
        {lastUpdate}
      </Text>
    </header>
  );
}
