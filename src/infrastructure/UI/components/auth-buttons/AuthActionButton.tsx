"use client";

import Button from "~/infrastructure/UI/components/Button/Button";
import type { ButtonProps } from "~/infrastructure/UI/components/Button/Button.d";

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
