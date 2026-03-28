"use client";

import Button from "~/infra/UI/components/Button/Button";
import type { ButtonProps } from "~/infra/UI/components/Button/types";

type AuthActionButtonProps = ButtonProps & {
  action: () => Promise<void>;
};

export default function AuthActionButton({
  action,
  ...props
}: AuthActionButtonProps) {
  return (
    <Button
      {...props}
      showLoader
      onClick={async () => {
        await action();
      }}
    />
  );
}
