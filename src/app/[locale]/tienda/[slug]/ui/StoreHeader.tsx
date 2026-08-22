import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { MdLink, MdPhone } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import { buildWhatsappStoreLink } from "~/domain/entities/seller/whatsappContact";
import { Link } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import type { FollowSnapshot } from "~/infra/dataAccess/follows/readFollowState";
import FollowButton from "~/presentation/follow/FollowButton/FollowButton";
import FollowerCount from "~/presentation/follow/FollowerCount";
import StoreDistance from "~/presentation/location/StoreDistance";
import WhatsappButton from "~/presentation/post/WhatsappButton/WhatsappButton";
import ShareMenu from "~/presentation/sharing/ShareMenu/ShareMenu";
import { profileHref } from "../../../cuenta/profilePath";
import { storePath } from "../../../cuenta/storePath";

export default function StoreHeader({
  seller,
  ownerUsername,
  distanceMeters = null,
  follow,
  isOwner = false,
  canFollow,
  path,
}: {
  seller: Seller;
  /** La dirección personal del dueño, si la reclamó: la tienda enlaza a quien está detrás. */
  ownerUsername?: string | null;
  /** Metros hasta su sucursal más cercana. `StoreDistance` no pinta nada cuando es `null`. */
  distanceMeters?: number | null;
  /** Cuántos la siguen y si quien mira ya lo hace. Lo resuelve la página: aquí no se consulta. */
  follow: FollowSnapshot;
  /** A la dueña no se le ofrece seguir su propia tienda: se le invita a compartirla. */
  isOwner?: boolean;
  /** Si quien mira tiene sesión: sin ella, seguir lleva a entrar. */
  canFollow: boolean;
  /** La ruta a refrescar tras seguir, para que el contador del resto también quede al día. */
  path: string;
}) {
  const t = useTranslations("store");
  const tShare = useTranslations("share");
  const locale = resolveLocale(useLocale());
  // La misma dirección para escribir al vendedor y para repartir la tienda: una sola verdad.
  const storeUrl = `${PUBLIC_BASE_URL}${storePath(seller.handle ?? "", locale)}`;
  const contactLink = buildWhatsappStoreLink({
    storeName: seller.name,
    url: storeUrl,
    phone: seller.phone,
  });

  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold" data-testid="store-name">
        {seller.name}
      </h1>
      <div className="flex-col flex lg:flex-row items-center gap-4">
        {/* 400px arriba del todo: **esta** es la que el navegador mide como contenido más grande
            de la tienda, así que lleva las dos cosas —`preload` la adelanta, `fetchPriority` la
            pone por delante—. */}
        {seller.logoUrl ? (
          <Image
            src={seller.logoUrl}
            alt={`Logo de ${seller.name}`}
            width={400}
            height={400}
            preload
            fetchPriority="high"
            className="rounded-full object-cover"
          />
        ) : null}

        {seller.description ? (
          <p className="mt-4 whitespace-pre-wrap">{seller.description}</p>
        ) : null}

        {/* Seis cosas iban aquí en una sola columna, todas al mismo nivel y con la separación
            decidida una por una (`mb-2`, `mt-2`, nada): un dato, dos contactos, dos acciones y una
            navegación. Sin agrupar no hay dónde descansar la vista, y por eso se veían amontonadas.

            Ahora van en tres grupos por lo que son —lo que se consulta, lo que se hace, y a dónde
            se va—, cada uno con una única separación. `justify-around content-around` se cae: en
            una columna de altura automática no hay espacio libre que repartir. */}
        <div className="flex flex-col items-center gap-4">
          {/* Lo que se consulta: dónde está, a qué número, en qué web. */}
          <div className="flex flex-col items-center gap-1">
            <StoreDistance meters={distanceMeters} />

            <p className="flex items-center">
              <MdPhone className="mr-2" size="24" aria-hidden />
              <a
                href={`tel:${seller.phone}`}
                className="font-bold text-pw-orange"
                data-testid="store-phone"
              >
                {seller.phone}
              </a>
            </p>

            {seller.url ? (
              <a
                href={seller.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="store-url"
                className="flex items-center text-highlight hover:underline"
              >
                <MdLink className="mr-2" size="24" aria-hidden />
                {seller.url.replace(/^https?:\/\//, "")}
              </a>
            ) : null}
          </div>

          {/* Seguir va antes de escribir: es el compromiso más barato que se le puede pedir a
              quien acaba de llegar, y escribir por WhatsApp es el más caro. A la dueña no se le
              ofrece —nadie se sigue a sí mismo—, se le invita a repartir su página. */}
          {isOwner ? (
            <FollowerCount total={follow.followers} />
          ) : (
            <FollowButton
              sellerId={seller.id}
              canFollow={canFollow}
              followers={follow.followers}
              isFollowing={follow.isFollowing}
              path={path}
            />
          )}

          {/* Lo que se hace, en fila y no apiladas: son dos botones, y uno debajo del otro leían
              como una lista de opciones en vez de como la acción principal y su acompañante.

              Compartir lo pulsa **el comprador**, no el vendedor: es quien acaba de decidir que
              esta tienda vale la pena. Por eso el texto va en su voz ("esta tienda") y no en la
              del dueño, que es la que usa `/cuenta`. */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <WhatsappButton href={contactLink} testId="whatsapp-store">
              {t("contactOnWhatsapp")}
            </WhatsappButton>

            <ShareMenu
              testId="share-store-page"
              url={storeUrl}
              title={seller.name}
              text={tShare("storeText", { name: seller.name })}
            />
          </div>

          {/* A dónde se va: no es una acción sobre esta tienda, es irse a otra página. Va al final
              y en pequeño para que no compita con el botón de escribir. El `mt-2` se cae: la
              separación ya la pone el `gap` de la columna. */}
          {ownerUsername ? (
            <Link
              href={profileHref(ownerUsername)}
              data-testid="store-owner-link"
              className="text-sm text-highlight hover:underline"
            >
              {t("viewSellerProfile")}
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
