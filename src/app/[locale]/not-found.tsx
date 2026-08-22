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

      <h2 className="text-xl md:text-2xl font-bold hidden md:block">
        {t("subtitle")}
      </h2>

      <h3 className="text-lg md:text-xl font-bold">{t("rest")}</h3>

      <Image src="/404/404.webp" alt={t("imageAlt")} width={462} height={283} />

      <h4 className="md:tex-3xl font-bold">{t("invite")}</h4>

      <p>
        <Link href="/">
          <Button color="green">{t("goHome")}</Button>
        </Link>
      </p>
    </section>
  );
}
