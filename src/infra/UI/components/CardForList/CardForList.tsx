import { Link } from "~/i18n/navigation";
import type { Post } from "~/infra/types/Posts";
import Card from "~/infra/UI/components/Card";
import CategoryTag from "~/infra/UI/components/CategoryTag/CategoryTag";
import CurrencyAmount from "~/infra/UI/components/CurrencyAmount";
import MediaContent from "~/infra/UI/components/MediaContent/MediaContent";
import ProvenanceBadge from "~/infra/UI/components/ProvenanceBadge";
import SoldOutBadge from "~/infra/UI/components/SoldOutBadge/SoldOutBadge";

export default function CardForList(props: Post) {
  const {
    id,
    title,
    media,
    createdAt,
    price,
    user,
    to,
    kind,
    origin,
    isAvailable,
    categoryLabel,
  } = props;
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
      <span className="flex flex-wrap items-center gap-2 mt-1">
        <ProvenanceBadge origin={origin} />
        <CategoryTag label={categoryLabel} />
        <SoldOutBadge kind={kind} isAvailable={isAvailable} />
      </span>

      <CurrencyAmount
        value={price}
        currency="MXN"
        className="text-xl text-pw-green block mt-1"
      ></CurrencyAmount>
    </Card>
  );
}
