import Link from "next/link";
import Card from "~/infrastructure/UI/components/Card";
import CurrencyAmount from "~/infrastructure/UI/components/CurrencyAmount";
import { Post } from "~/infrastructure/types/Posts";
import MediaContent from "~/infrastructure/UI/components/MediaContent/MediaContent";


export default function CardForList(props: Post) {
  // const userLocale = typeof window !== 'undefined' ? navigator.language : 'es-MX';
  const { id, title, media, createdAt, price, user, to } = props;
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
          <MediaContent media={media} className="h-64" />
        </Link>
      }
    >
      <CurrencyAmount
        value={price}
        locale="es-MX"
        currency="MXN"
      ></CurrencyAmount>
    </Card>
  );
}