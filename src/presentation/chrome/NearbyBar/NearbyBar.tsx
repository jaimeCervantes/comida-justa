import { getTranslations } from "next-intl/server";
import { readViewerLocationContext } from "~/infra/location/viewerLocationContext";
import LocationChip from "~/presentation/location/LocationChip";
import LocationNotice from "~/presentation/location/LocationNotice";
import NearbyPillarFilter from "~/presentation/location/NearbyPillarFilter";

/**
 * La barra «cerca de ti»: desde dónde se miden las distancias, y cómo corregirlo.
 *
 * **Es chrome, no página.** Antes esta decisión estaba escrita seis veces —`/productos` y su
 * paginado, `/categoria/[key]` y el suyo, el directorio y la sección local de cada pilar— y en la
 * ruta de entrada no estaba escrita ninguna: el commit `8b4d9bf` dejó de montar `HomeHero`, que era
 * quien la llevaba, y con él se fue la única forma de corregir una ubicación desde el home. La
 * cookie dura un año, así que quien la compartió mal se quedaba sin salida. Montada aquí, una
 * página nueva ya no tiene que acordarse de nada para que su cercanía signifique algo.
 *
 * **No va dentro del `<header>`, y es a propósito.** El header es `sticky` y en un teléfono ya apila
 * dos filas —64px de acciones y unos 52 de búsqueda—. Una tercera fila fija se comería ~152px de
 * una pantalla de 640: casi un cuarto del sitio, para siempre. Corregir la ubicación es una acción
 * rara; anclarla cuesta más de lo que ahorra. Así que la barra está en todas las rutas y se
 * desplaza con la página.
 *
 * Las dos caras son las que ya existían (`LocationChip` cuando sabemos dónde estás, `LocationNotice`
 * cuando no), con sus mismos `data-testid`: lo que cambió es dónde se montan, no qué dicen.
 *
 * **El filtro de pilares se une aquí, sin volverse fija.** El `@slice-4` de `chrome.feature` pedía
 * subir `PublicationPillarFilter` a esta barra; el roadmap original la dibujaba `sticky`, y eso ya
 * se evaluó arriba y se descartó por el mismo motivo — así que el filtro hereda el criterio de la
 * barra que lo aloja, no al revés. `NearbyPillarFilter` decide solo, por ruta, si hay algo que
 * mostrar: `NearbyBar` sigue sin saber en qué página está.
 *
 * **Una fila, y una sola, en cualquier ancho.** Al juntarse las tres piezas la barra pasó a
 * partirse en dos y tres renglones, y en un teléfono se comía la primera pantalla de todas las
 * rutas — que es el precio de ser chrome. El `@slice-5` lo arregla por donde sobraba: las
 * explicaciones de las dos caras se mudaron a su nombre accesible, así que aquí solo quedan
 * controles.
 *
 * **El contenedor que se desliza es esta fila, no el filtro.** La primera versión partía la barra
 * por debajo de `lg` y le daba al filtro su propio renglón deslizable: dos renglones en un
 * teléfono, y un scroll que solo servía para la mitad de la barra. El usuario lo corrigió — «si
 * todo está en el renglón, el scroll tiene más propósito y menos espacio vertical»— y tiene razón:
 * un solo eje de desplazamiento para toda la barra es más simple de explicar y **un** renglón
 * cuesta la mitad que dos. Por eso el `overflow-x` vive aquí y cada pieza es `shrink-0`: lo que no
 * cabe se arrastra, nada se comprime ni se parte.
 *
 * **Y se avisa de que sigue.** Esconder la barra de desplazamiento ahorra alto pero deja la fila
 * sin decir que continúa, y un filtro al que nadie sabe llegar es un filtro que no existe. Lo dice
 * `scroll-hint-x` (`utility-patterns.css`): un desvanecido con una flechita en cada borde, hecho
 * de capas de fondo, que aparece solo del lado que todavía tiene contenido y desaparece entero
 * cuando la fila cabe. Cuesta cero alto, que era la condición.
 */
export default async function NearbyBar(): Promise<React.ReactElement> {
  const t = await getTranslations("distance");
  /* Una sola lectura para las dos preguntas: `readViewerLocationContext` se salta la consulta del
     vendedor cuando ya hay ubicación, porque entonces no hay aviso donde poner esa invitación. */
  const { fix, showSellerCta } = await readViewerLocationContext();

  return (
    <div
      data-testid="nearby-bar"
      className="border-b border-separator bg-surface-elevation-1"
    >
      {/* `py-2` no es solo aire: `overflow-x` recorta también en vertical, y esos 8px son los que
          dejan que el anillo de foco de un filtro se vea entero al tabular. */}
      <div className="container-width no-scrollbar scroll-hint-x flex items-center gap-x-4 overflow-x-auto py-2">
        {/* El rótulo en versalitas del 5.1: dice de qué va la barra sin gastar un renglón. Se
            esconde en pantallas estrechas, donde el sitio horizontal es el caro y el propio
            control ya se explica solo. */}
        <span className="hidden shrink-0 text-label font-medium uppercase tracking-[0.14em] text-text-muted sm:inline">
          {t("barLabel")}
        </span>

        {fix ? (
          <LocationChip fix={fix} />
        ) : (
          <LocationNotice showSellerCta={showSellerCta} />
        )}

        <NearbyPillarFilter />
      </div>
    </div>
  );
}
