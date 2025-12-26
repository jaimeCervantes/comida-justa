"use client";

import Button from "~/infrastructure/UI/components/Button/Button";
import type { ButtonProps } from "~/infrastructure/UI/components/Button/Button.d";
import { useRouter } from "next/navigation";

type LinkButtonProps = ButtonProps & {
  href: string;
};

export default function LinkButton({
  href,
  onClick,
  ...props
}: LinkButtonProps) {
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

  return <Button {...props} showLoader onClick={handleClick} />;
}
