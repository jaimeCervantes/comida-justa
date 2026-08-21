import type { ReactNode } from "react";
import type { StoreSummary } from "~/domain/entities/seller/directory";
import { Link } from "~/i18n/navigation";
import { categoryHref, storeHref } from "~/i18n/routes";
import type { Post } from "~/infra/types/Posts";
import { CARD_MASONRY } from "~/presentation/design_system/surfaces/cardList";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import StoreSummaryCard from "~/presentation/directory/StoreSummaryCard";
import CardForList from "~/presentation/post/CardForList/CardForList";
import { PillarSectionHeading } from "./PillarArticle";
import { type PillarKey, pillarColorClasses } from "./pilaresData";

export type PillarLocalCopy = {
  heading: string;
  intro: string;
  /** Lo que dice la sección cuando todavía no hay nadie de este pilar cerca. */
  emptyBody: string;
  publishLabel: string;
  seeAllLabel: string;
  storesHeading: string;
  publicationsLabel: (count: number) => string;
  visitLabel: string;
};

/**
 * Quién de la zona sostiene este pilar: qué se le compra y a quién.
 *
 * Es el tramo que le faltaba al puente. Las páginas de pilar ya hablaban de lo local —el mercado en
 * Alimentación, el gimnasio de barrio en Movimiento— pero ese texto no enlazaba con nadie, mientras
 * la base tenía tiendas ubicadas y publicaciones ya categorizadas por pilar. Aquí se encuentran.
 *
 * **Recibe la copia y los datos ya resueltos**, como `PillarBridges` y `PillarCatalog`: quien la
 * pinta es `PillarLocal`, que sí lee la base y la sesión. Así esta se prueba sin base de datos.
 *
 * El estado vacío **no es un caso de borde, es la mitad del trabajo**: hoy solo Alimentación tiene
 * publicaciones y los otros tres pilares están a cero. Se aplica lo que ya decidieron los dos
 * directorios de la comunidad — nunca una lista hueca: se dice que aún no hay nadie y se invita a
 * ser el primero. La invitación es real, no decorativa: `/publicar` ofrece las cuatro raíces del
 * catálogo y la sub-categoría es opcional.
 */
export default function PillarLocalSection({
  pillar,
  categoryKey,
  copy,
  posts,
  stores,
  viewerId,
}: {
  pillar: PillarKey;
  categoryKey: string;
  copy: PillarLocalCopy;
  posts: Post[];
  stores: readonly StoreSummary[];
  viewerId?: string | null;
}): ReactNode {
  const color = pillarColorClasses[pillar];
  const isEmpty = posts.length === 0 && stores.length === 0;

  return (
    /* `data-category` va en la sección y no solo en el enlace de "ver todo": ese enlace no existe
       cuando el pilar está vacío, que es hoy el caso de tres de los cuatro, y el mapeo pilar →
       categoría tiene que poder verificarse justo ahí — es donde una errata pasa desapercibida. */
    <section
      data-testid="pillar-local"
      data-pillar={pillar}
      data-category={categoryKey}
    >
      <PillarSectionHeading>{copy.heading}</PillarSectionHeading>
      <p className="mb-6">{copy.intro}</p>

      {isEmpty ? (
        <Surface
          radius="card"
          elevation="xs"
          className={`border p-6 ${color.bg} ${color.border}`}
        >
          <p data-testid="pillar-local-empty" className="text-base">
            {copy.emptyBody}
          </p>
          <Link
            href="/publicar"
            className={`focus-ring mt-4 inline-flex rounded-lg font-semibold underline ${color.link}`}
          >
            {copy.publishLabel}
          </Link>
        </Surface>
      ) : (
        <>
          {stores.length > 0 ? (
            <>
              {/* `h3` y no otro `h2`: las tiendas son una parte de «Cerca de ti», no una sección
                  hermana, y dos `h2` seguidos rompen el esquema del artículo para quien navega con
                  lector de pantalla. */}
              <Heading level={3} size="sm" className="mb-3">
                {copy.storesHeading}
              </Heading>
              <ul
                data-testid="pillar-local-stores"
                className="mb-6 grid list-none grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4 p-0"
              >
                {stores.map((store) => (
                  <li key={store.handle}>
                    <StoreSummaryCard
                      store={store}
                      href={storeHref(store.handle)}
                      publicationsLabel={copy.publicationsLabel(
                        store.publicationCount,
                      )}
                      visitLabel={copy.visitLabel}
                    />
                  </li>
                ))}
              </ul>
            </>
          ) : null}

          {posts.length > 0 ? (
            <div data-testid="pillar-local-posts" className={CARD_MASONRY}>
              {posts.map((post: Post) => (
                <CardForList {...post} viewerId={viewerId} key={post.id} />
              ))}
            </div>
          ) : null}

          <p className="mt-6">
            <Link
              href={categoryHref(categoryKey)}
              className={`focus-ring inline-flex rounded-lg font-semibold underline ${color.link}`}
            >
              {copy.seeAllLabel}
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
