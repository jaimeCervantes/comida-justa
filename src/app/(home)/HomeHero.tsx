import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

/**
 * La portada del inicio: qué promete el sitio y desde dónde está mirando quien llega.
 *
 * Es propia y no un `PillarHero` con otro color por dos motivos. El primero es de identidad: los
 * pilares se presentan cada uno con el suyo —morado sueño, verde movimiento—, y el inicio es de la
 * marca, así que va en el naranja del logo. El segundo es de forma: aquí el hero tiene dos columnas
 * porque la ubicación se sube a la portada, y `PillarHero` es una sola columna de texto al servicio
 * de cinco páginas que no quieren esa complicación.
 *
 * **La ubicación entra como `locationPanel`, no importada.** Leerla es asíncrono y toca cookies; si
 * este componente la pidiera por su cuenta dejaría de poder renderizarse en una prueba sin montar
 * media petición. La página, que ya es asíncrona, la pasa hecha.
 */
export default function HomeHero({
  locationPanel,
}: {
  locationPanel: ReactNode;
}): React.ReactNode {
  const t = useTranslations("home");

  return (
    <header className="relative isolate overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#7a1c05_0%,var(--color-pw-orange)_55%,var(--color-pw-lightorange)_135%)] px-6 py-8 text-white shadow-xl sm:px-10 sm:py-10">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-15 [background-image:radial-gradient(circle_at_20%_20%,white_0_3px,transparent_4px),radial-gradient(circle_at_75%_70%,white_0_6px,transparent_7px)] [background-size:68px_68px,124px_124px]"
      />
      {/* El orbe se queda verde: el naranja es del logo tanto como el verde, y así la portada no
          pierde el segundo color de la marca al cambiar de fondo. */}
      <div
        aria-hidden="true"
        className="absolute -right-16 -top-24 -z-10 size-72 rounded-full bg-pw-lightgreen/25 blur-3xl"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-center lg:gap-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-100">
            {t("heroEyebrow")}
          </p>
          <h1 className="mt-2 text-3xl font-black leading-tight tracking-tight sm:text-4xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 max-w-2xl leading-relaxed text-amber-50 sm:text-lg">
            {t("heroIntro")}
          </p>
          {/* Los emojis son de la marca y van fuera del texto traducible: así no hay que repetirlos
              —ni mantenerlos— en cada idioma, y quien usa lector de pantalla no los oye deletrear. */}
          <p className="mt-4 flex items-start gap-2 font-semibold italic">
            <span aria-hidden="true" className="not-italic">
              ❤️💚
            </span>
            {t("heroIdentity")}
          </p>
        </div>

        {/* Tarjeta clara a propósito: el aviso de ubicación y su chip se pintan con los grises del
            sitio, que sobre el verde de la marca no se leerían. El `pb-0` deja que el margen inferior
            que ya trae el aviso haga de relleno, en vez de sumar dos. */}
        <div className="rounded-2xl bg-surface-elevation-1 p-4 pb-0 text-text-base shadow-lg">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-pw-green">
            {t("heroLocationTitle")}
          </p>
          <div className="mt-3">{locationPanel}</div>
        </div>
      </div>
    </header>
  );
}
