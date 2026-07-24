import Link from "next/link";
import Card from "~/infra/UI/components/Card";
import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import { Post } from "~/infra/types/Posts";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import ProvenanceBadge from "~/infra/UI/components/ProvenanceBadge";

export default function CardForList(props: Post) {
  // const userLocale = typeof window !== 'undefined' ? navigator.language : 'es-MX';
  const { id, title, media, createdAt, price, user, to, origin } = props;
  const anchorProps = { href: to, title: title };

  return (
    <Card
      key={id}
      title={title}
      createdAt={createdAt}
      user={user}
      className="flex flex-col justify-between"
      AnchorElement={Link}
      anchorProps={anchorProps}
      media={
        <Link {...anchorProps}>
          <MediaContent media={media[0]} className="h-64" />
        </Link>
      }
    >
      <ProvenanceBadge origin={origin} className="mt-1" />

      <CurrencyAmount
        value={price}
        locale="es-MX"
        currency="MXN"
        className="text-xl text-pw-green block mt-1"
      ></CurrencyAmount>
    </Card>
  );
}
