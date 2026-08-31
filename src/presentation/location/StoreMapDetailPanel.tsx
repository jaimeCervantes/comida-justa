"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { MdArticle, MdClose, MdStorefront } from "react-icons/md";
import type {
  MappedStore,
  MappedStorePost,
} from "~/domain/entities/seller/map";
import { Link } from "~/i18n/navigation";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { Text } from "~/presentation/design_system/typography/Text";
import StoreDistance from "./StoreDistance";

export default function StoreMapDetailPanel({
  className,
  store,
  onClose,
}: {
  className?: string;
  store: MappedStore;
  onClose: () => void;
}): ReactElement {
  const t = useTranslations("distance");
  const closeLabel = t("closeStoreDetail");
  const recentPosts = store.recentPosts ?? [];

  return (
    <Surface
      as="aside"
      radius="panel"
      border="subtle"
      elevation="sm"
      background="raised"
      className={cn("p-4 lg:p-5", className)}
      data-testid="store-map-detail-panel"
    >
      <div className="flex items-start gap-3">
        <StoreLogo logoUrl={store.logoUrl ?? null} name={store.name} />

        <div className="min-w-0 flex-1">
          <Text
            as="p"
            variant="caption"
            tone="support"
            weight="semibold"
            className="uppercase tracking-[0.14em]"
          >
            {t("selectedStoreEyebrow")}
          </Text>
          <Heading level={3} size="xs" className="mt-1">
            {store.name}
          </Heading>
        </div>

        <button
          type="button"
          aria-label={closeLabel}
          title={closeLabel}
          onClick={onClose}
          className={cn(
            "focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-control text-text-support transition-colors duration-fast hover:bg-surface-elevation-2 hover:text-text-base",
          )}
        >
          <MdClose aria-hidden className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <StoreDistance meters={store.meters} />
      </div>

      {recentPosts.length > 0 ? (
        <section className="mt-4" aria-labelledby="store-map-posts-heading">
          <Text
            as="h4"
            id="store-map-posts-heading"
            variant="caption"
            tone="support"
            weight="semibold"
            className="mb-2 uppercase tracking-[0.14em]"
          >
            {t("recentStorePosts")}
          </Text>
          <div
            className="grid grid-cols-2 gap-2"
            data-testid="store-map-recent-posts"
          >
            {recentPosts.map((post) => (
              <RecentPostLink key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : null}

      <Link
        href={{ pathname: "/tienda/[slug]", params: { slug: store.handle } }}
        className={cn(
          buttonVariants({ color: "green", size: "sm" }),
          "mt-5 w-full",
        )}
      >
        {t("openSelectedStore")}
      </Link>
    </Surface>
  );
}

function StoreLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}): ReactElement {
  const className =
    "h-12 w-12 shrink-0 overflow-hidden rounded-control border border-separator bg-surface-elevation-2 shadow-xs";

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={48}
        height={48}
        sizes="48px"
        className={cn(className, "object-cover")}
        data-testid="store-map-detail-logo"
      />
    );
  }

  return (
    <span
      className={cn(
        className,
        "grid place-items-center bg-fuchsia-700 text-white",
      )}
      data-testid="store-map-detail-logo-fallback"
    >
      <MdStorefront aria-hidden className="h-6 w-6" />
    </span>
  );
}

function RecentPostLink({ post }: { post: MappedStorePost }): ReactElement {
  return (
    <Link
      href={{ pathname: "/[slug]", params: { slug: post.slug } }}
      className="focus-ring group block overflow-hidden rounded-control border border-separator bg-surface-elevation-2 transition-colors duration-fast hover:border-accent-primary/40 hover:bg-surface-elevation-1"
    >
      <span className="relative block aspect-[4/3] w-full overflow-hidden bg-surface-elevation-2">
        {post.imageUrl ? (
          <Image
            src={post.imageUrl}
            alt={post.imageAlt ?? post.title}
            fill
            sizes="(min-width: 1024px) 10rem, 45vw"
            className="object-cover transition-transform duration-base group-hover:scale-[1.03]"
          />
        ) : (
          <span className="grid h-full w-full place-items-center text-text-support">
            <MdArticle aria-hidden className="h-6 w-6" />
          </span>
        )}
      </span>
      <span className="line-clamp-2 min-h-[2.25rem] px-2 py-1.5 text-[0.78rem] font-medium leading-snug text-text-base">
        {post.title}
      </span>
    </Link>
  );
}
