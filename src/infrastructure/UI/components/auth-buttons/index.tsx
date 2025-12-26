import { signIn, signOut } from "~/infrastructure/auth";
import { PersonIcon, ExitIcon } from "@radix-ui/react-icons";
import AuthActionButton from "./AuthActionButton";
import { Suspense } from "react";

export function SignIn({
  provider,
  children,
  ...props
}: { provider?: string } & Omit<
  React.ComponentProps<typeof AuthActionButton>,
  "action"
>) {
  return (
    <AuthActionButton
      color="green"
      startIcon={<PersonIcon />}
      {...props}
      action={async () => {
        "use server";
        await signIn(provider);
      }}
    >
      {children}
    </AuthActionButton>
  );
}

export function SignOut({
  children,
  ...props
}: Omit<React.ComponentProps<typeof AuthActionButton>, "action">) {
  return (
    <AuthActionButton
      color="black"
      startIcon={<ExitIcon />}
      {...props}
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      {children}
    </AuthActionButton>
  );
}
