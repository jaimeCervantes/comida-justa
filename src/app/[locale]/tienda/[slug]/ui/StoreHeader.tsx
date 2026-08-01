import Image from "next/image";
import { MdPhone } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";
import { buildWhatsappStoreLink } from "~/domain/entities/seller/whatsappContact";
import { PUBLIC_BASE_URL } from "~/infra/constants";
import WhatsappButton from "~/infra/UI/components/WhatsappButton/WhatsappButton";
import { storePath } from "../../../cuenta/storePath";

export default function StoreHeader({ seller }: { seller: Seller }) {
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

          <WhatsappButton
            href={contactLink}
            className=""
            testId="whatsapp-store"
          >
            Escribir por WhatsApp
          </WhatsappButton>
        </div>
      </div>
    </header>
  );
}
