"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "~/i18n/navigation";
import {
  Button,
  type ButtonProps,
} from "~/presentation/design_system/buttons/Button";

type LinkButtonProps = ButtonProps & {
  href: string;
};

export default function LinkButton({
  href,
  onClick,
  ...props
}: LinkButtonProps) {
  const t = useTranslations("common");
  const router = useRouter();

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      await Promise.resolve(onClick(e));
    }
    // Artificial delay to show the loader briefly if navigation is instant,
    // or to ensure the user sees the feedback.
    // However, router.push is async-ish but returns void.
    // We can just await a small timeout to let the spinner show
    // and then push.
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(href);
  };

  /* Este es el botón que más se ve girando sin texto propio (el "Publicar" del header, que en
     móvil es solo un icono), así que es el que gana con una etiqueta de carga traducida. */
  return (
    <Button
      {...props}
      showLoader
      loadingLabel={t("loading")}
      onClick={handleClick}
    />
  );
}
