import { signIn, signOut } from "~/auth";
import Button from "~/components/ui/Button";
import { PersonIcon, ExitIcon } from "@radix-ui/react-icons";

export function SignIn({
  provider,
  children,
  ...props
}: { provider?: string } & React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form
      action={async () => {
        "use server";
        await signIn(provider);
      }}
    >
      <Button color="green" startIcon={<PersonIcon />} {...props}>
        {children}
      </Button>
    </form>
  );
}

export function SignOut({
  children,
  ...props
}: React.ComponentPropsWithRef<typeof Button>) {
  return (
    <form
      action={async () => {
        "use server";
        await signOut();
      }}
    >
      <Button color="black" startIcon={<ExitIcon />} {...props}>
        {children}
      </Button>
    </form>
  );
}
