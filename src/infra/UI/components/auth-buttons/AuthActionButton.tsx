"use client";

import {
  Button,
  type ButtonProps,
} from "~/presentation/design_system/buttons/Button";

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
