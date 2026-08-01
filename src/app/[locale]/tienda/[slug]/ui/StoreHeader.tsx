import Image from "next/image";
import { MdLink, MdPhone } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import { buildWhatsappStoreLink } from "~/domain/entities/seller/whatsappContact";
import { Link } from "~/i18n/navigation";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import WhatsappButton from "~/infra/UI/components/WhatsappButton/WhatsappButton";
import { profilePath } from "../../../cuenta/profilePath";
import { storePath } from "../../../cuenta/storePath";

export default function StoreHeader({
  seller,
  ownerUsername,
}: {
  seller: Seller;
  /** La dirección personal del dueño, si la reclamó: la tienda enlaza a quien está detrás. */
  ownerUsername?: string | null;
}) {
  const contactLink = buildWhatsappStoreLink({
    storeName: seller.name,
    url: `${PUBLIC_BASE_URL}${storePath(seller.handle ?? "")}`,
    phone: seller.phone,
  });

  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold" data-testid="store-name">
        {seller.name}
      </h1>
      <div className="flex-col flex lg:flex-row items-center gap-4">
        {seller.logoUrl ? (
          <Image
            src={seller.logoUrl}
            alt={`Logo de ${seller.name}`}
            width={400}
            height={400}
            priority
            className="rounded-full object-cover"
          />
        ) : null}

        {seller.description ? (
          <p className="mt-4 whitespace-pre-wrap">{seller.description}</p>
        ) : null}

        <div className="flex flex-col items-center justify-around content-around">
          <p className="flex items-center">
            <MdPhone className="mr-2" size="24" />
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
              className="flex items-center text-pw-lightgreen hover:underline"
            >
              <MdLink className="mr-2" size="24" aria-hidden />
              {seller.url.replace(/^https?:\/\//, "")}
            </a>
          ) : null}

          <WhatsappButton
            href={contactLink}
            className=""
            testId="whatsapp-store"
          >
            Escribir por WhatsApp
          </WhatsappButton>

          {ownerUsername ? (
            <Link
              href={profilePath(ownerUsername)}
              data-testid="store-owner-link"
              className="mt-2 text-sm text-pw-lightgreen hover:underline"
            >
              Ver el perfil de quien vende
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}
