import { headers } from "next/headers";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "~/i18n/navigation";
import { Button } from "~/presentation/design_system/buttons/Button";
import { Heading } from "~/presentation/design_system/typography/Heading";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const headersList = await headers();
  const _mappedHeaders = Array.from(headersList);

  return (
    <section className="flex flex-col justify-center gap-4 items-center">
      <Heading level={1}>{t("heading")}</Heading>

      <Heading level={2} className="hidden md:block">
        {t("subtitle")}
      </Heading>

      <Heading level={3}>{t("rest")}</Heading>

      <Image src="/404/404.webp" alt={t("imageAlt")} width={462} height={283} />

      <Heading level={4}>{t("invite")}</Heading>

      <p>
        <Link href="/">
          <Button color="green">{t("goHome")}</Button>
        </Link>
      </p>
    </section>
  );
}
