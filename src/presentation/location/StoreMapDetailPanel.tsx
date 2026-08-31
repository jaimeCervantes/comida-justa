"use client";

import { useTranslations } from "next-intl";
import { MdClose, MdStorefront } from "react-icons/md";
import type { MappedStore } from "~/domain/entities/seller/map";
import { Link } from "~/i18n/navigation";
import { buttonVariants } from "~/presentation/design_system/buttons/buttonVariants";
import { cn } from "~/presentation/design_system/styling/merge-class-names";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import { Text } from "~/presentation/design_system/typography/Text";
import StoreDistance from "./StoreDistance";

export default function StoreMapDetailPanel({
  store,
  onClose,
}: {
  store: MappedStore;
  onClose: () => void;
}) {
  const t = useTranslations("distance");
  const closeLabel = t("closeStoreDetail");

  return (
    <Surface
      as="aside"
      radius="panel"
      border="subtle"
      elevation="sm"
      background="raised"
      className="p-4 lg:p-5"
      data-testid="store-map-detail-panel"
    >
      <div className="flex items-start gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-control bg-fuchsia-700 text-white shadow-xs">
          <MdStorefront aria-hidden className="h-5 w-5" />
        </span>

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
        <Text variant="label" tone="support">
          {t("storeDetailHint")}
        </Text>
      </div>

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
