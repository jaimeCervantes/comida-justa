import Image from "next/image";
import { MdPhone } from "react-icons/md";
import type { Seller } from "~/domain/entities/seller/types";

export default function StoreHeader({ seller }: { seller: Seller }) {
  return (
    <header className="mb-6">
      <div className="flex items-center gap-4">
        {seller.logoUrl ? (
          <Image
            src={seller.logoUrl}
            alt={`Logo de ${seller.name}`}
            width={80}
            height={80}
            priority
            className="rounded-full object-cover w-20 h-20"
          />
        ) : null}

        <h1 className="text-3xl font-bold" data-testid="store-name">
          {seller.name}
        </h1>
      </div>

      {seller.description ? (
        <p className="mt-4 whitespace-pre-wrap">{seller.description}</p>
      ) : null}

      <p className="flex items-center mt-4">
        <MdPhone className="mr-2" size="24" />
        <a
          href={`tel:${seller.phone}`}
          className="font-bold text-pw-orange"
          data-testid="store-phone"
        >
          {seller.phone}
        </a>
      </p>
    </header>
  );
}
