import { useTranslations } from "next-intl";
import {
  type PublicationPillar,
  publicationPillarForCategory,
  publicationPillarNumber,
} from "~/domain/entities/post/publicationPillars";
import type { PostUser } from "~/infra/types/Posts";
import { pillarColorClasses } from "~/presentation/habits/pillarColors";
import Avatar from "~/presentation/user/Avatar";

/**
 * La portada de una práctica publicada sin foto.
 *
 * Practicar publica todos los días, y el ritual no pide evidencia: sin esto, el feed se llenaba de
 * recuadros grises que dicen «Publicación sin imagen», que se lee como un error y no como una
 * práctica. Aquí no falta nada — es la portada que le toca.
 *
 * **Partida en dos mitades**: arriba el avatar de quien practicó, abajo el sello del pilar. El feed
 * es social, y "quién lo hace" importa tanto como "qué pilar es" — ver
 * `docs/features/community/012-2026-09-18-portada-practica-avatar.md`.
 *
 * **El sello se dibuja, no se descarga.** Cuatro fotos serían cuatro archivos que mantener, y un SVG
 * servido por `next/image` obligaría a abrir `dangerouslyAllowSVG`, que aplicaría también a lo que
 * sube la gente. Esto es marcado inline con los tokens del pilar, así que cambia con el tema y pesa
 * cero. El avatar sí es una foto real cuando existe: es el mismo `Avatar` que firma el resto del
 * sitio, con su mismo respaldo de iniciales, aquí en su variante `cover` — ocupa toda su mitad en
 * vez de la burbuja redonda de tamaño fijo que usa el resto del sitio.
 *
 * **El número acompaña al color**, por la misma razón que en `PillarBadge`: Movimiento y Mente
 * contrastan 1.14 entre sí como tinta, así que el tono no puede ser lo único que los distinga.
 */
export default function PracticeCover({
  category,
  user,
  className = "",
}: {
  /** La categoría raíz de la publicación; de ella sale el pilar. */
  category?: string | null;
  /** Quién practicó. Sin evidencia propia, su avatar ocupa la otra mitad de la portada. */
  user?: PostUser | null;
  className?: string;
}): React.ReactNode {
  const t = useTranslations("publicationPillars");
  const pillar = publicationPillarForCategory(category);

  if (!pillar) return null;

  const color = pillarColorClasses[pillar];

  return (
    <div
      data-testid="practice-cover"
      data-pillar={pillar}
      className={`sj-media-wrapper flex flex-col ${className}`}
    >
      <div data-testid="practice-cover-avatar" className={`h-1/2 ${color.bg}`}>
        <Avatar user={user ?? undefined} size="cover" />
      </div>
      <div
        className={`flex h-1/2 flex-col items-center justify-center gap-1 p-4 ${color.bg}`}
      >
        <PracticeCoverMark pillar={pillar} />
        <p className={`text-label font-semibold ${color.text}`}>{t(pillar)}</p>
      </div>
    </div>
  );
}

/**
 * El sello del pilar: su número dentro de un anillo.
 *
 * `currentColor` lo hereda de la tinta del pilar, así que el trazo y el número no pueden
 * desincronizarse del texto que llevan debajo.
 */
function PracticeCoverMark({ pillar }: { pillar: PublicationPillar }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={`size-16 ${pillarColorClasses[pillar].text}`}
      role="presentation"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        opacity="0.45"
      />
      <text
        x="32"
        y="33"
        textAnchor="middle"
        dominantBaseline="central"
        fill="currentColor"
        fontSize="26"
        fontWeight="700"
      >
        {publicationPillarNumber(pillar)}
      </text>
    </svg>
  );
}
