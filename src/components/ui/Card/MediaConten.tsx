// components/ui/MediaContent.tsx
import Image from "next/image";
import CurrencyAmount from "./CurrencyAmount";
import { PostUser } from "~/types/Posts";

type Props = {
  title: string;
  image: { src: string; alt: string };
  createdAt: string;
  createdAtLocale: string;
  price: number;
  user: PostUser;
};

export default function MediaContent({
  title,
  image,
  price,
}: Props) {
  return (
    <div className="p-4">
      <picture>
        <img
          src={image.src}
          alt={image.alt}
          className="w-full h-48 object-cover rounded-xl mb-4"
        />
      </picture>
      <h2 className="text-lg font-bold">{title}</h2>
      <CurrencyAmount value={price} locale="es-MX" currency="MXN" />
    </div>
  );
}