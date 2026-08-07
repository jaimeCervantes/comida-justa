import { ExitIcon, PersonIcon } from "@radix-ui/react-icons";
import { signIn, signOut } from "~/infra/auth";
import AuthActionButton from "./AuthActionButton";

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
