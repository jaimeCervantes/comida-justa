import Link from "next/link";
import Card from "~/infra/components/ui/Card";
import CurrencyAmount from "~/infra/components/ui/CurrencyAmount";
import { Post } from "~/infra/types/Posts";
import MediaContent from "~/infra/components/ui/MediaContent/MediaContent";


export default function CardForList(props: Post) {
  const { id, title, media, createdAt, createdAtLocale, price, user, to } = props;
  const anchorProps = { href: to, title: title };

  return (
    <Card
      key={id}
      title={title}
      createdAt={createdAt}
      createdAtLocale={createdAtLocale}
      user={user}
      className="flex flex-col justify-between bg-white dark:bg-pw-gray rounded-3xl overflow-hidden hover:border-b-pw-lightgreen dark:border-t-0 dark:border-r-0 dark:border-l-0 border-b-8 border-b-transparent"
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