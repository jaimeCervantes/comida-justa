import { ExitIcon, PersonIcon } from "@radix-ui/react-icons";
import { getLocale } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { signOut } from "~/infra/auth";
import { redirectToSignInFromReferer } from "~/infra/auth/redirectToSignIn";
import AuthActionButton from "./AuthActionButton";

/**
 * El botón de entrar del encabezado, que está en todas las páginas y no sabe en cuál.
 *
 * Llamaba al `signIn()` de next-auth sin proveedor, que hace dos cosas peor: aterriza siempre en
 * `/auth/signin` sin prefijo —o sea que un visitante en inglés cambiaba de idioma al pulsarlo— y
 * pasa por `/api/auth/signin` para acabar en el mismo sitio. Aquí se va derecho a la pantalla del
 * idioma activo, y el `Referer` aporta la página desde la que se pidió entrar.
 */
export function SignIn({
  children,
  ...props
}: Omit<React.ComponentProps<typeof AuthActionButton>, "action">) {
  return (
    <AuthActionButton
      color="green"
      startIcon={<PersonIcon />}
      {...props}
      action={async () => {
        "use server";
        await redirectToSignInFromReferer();
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
        /* La portada, y no la página en la que se estaba: `signOut()` usa el `Referer` por
           omisión, y desde que el callback `redirect` respeta el destino eso dejaría a quien
           cierra sesión en `/cuenta` — o sea, de vuelta en la pantalla de acceso. Se nombra el
           destino, y con idioma: para quien navega en inglés, `/` es cambiar de idioma sin
           avisar. */
        const locale = resolveLocale(await getLocale());

        await signOut({ redirectTo: getPathname({ locale, href: "/" }) });
      }}
    >
      {children}
    </AuthActionButton>
  );
}
