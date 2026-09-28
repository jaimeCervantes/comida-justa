import Image from "next/image";

/**
 * La atribución que exigen los términos de Mapbox (Product Terms, 1.4.1 y 1.4.2) **mientras se
 * enseña un camino suyo**: logo, "© Mapbox", "© OpenStreetMap" e "Improve this map".
 *
 * Los textos van tal cual, sin traducir: son los que piden los términos, no copia del sitio. El
 * logo es el mismo que Mapbox usa en su propio control de atribución (`mapbox-gl.css`), en negro,
 * que es uno de los dos colores que permite su guía de marca.
 */
export default function MapboxAttribution() {
  return (
    <p
      className="mt-1 flex flex-wrap items-center gap-x-2 text-label text-text-support"
      data-testid="mapbox-attribution"
    >
      <a
        href="https://www.mapbox.com/about/maps/"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Image
          src="/brand/mapbox-logo.svg"
          alt="Mapbox"
          width={88}
          height={23}
          unoptimized
        />
      </a>
      <a
        href="https://www.mapbox.com/about/maps/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        © Mapbox
      </a>
      <a
        href="https://www.openstreetmap.org/about/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline"
      >
        © OpenStreetMap
      </a>
      <a
        href="https://www.mapbox.com/map-feedback/"
        target="_blank"
        rel="noopener noreferrer"
        className="font-medium underline"
      >
        Improve this map
      </a>
    </p>
  );
}
