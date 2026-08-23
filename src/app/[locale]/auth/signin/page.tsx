import { setRequestLocale } from "next-intl/server";
import { getPathname } from "~/i18n/navigation";
import { resolveLocale } from "~/i18n/routing";
import { safeReturnPath } from "~/infra/auth/returnPath";
import SignInOptions from "./ui/SignInOptions";

/**
 * La pantalla de acceso, que ahora **lee a dónde había que volver**.
 *
 * Era un Client Component entero, y por eso el `?callbackUrl=` que traía en la dirección no lo
 * miraba nadie. Se parte en dos: aquí el destino se lee y se valida en el servidor, y el cliente
 * solo se ocupa de los botones. De paso la sección puede llamar a `setRequestLocale`.
 *
 * Sin destino válido se vuelve a la portada **del idioma activo**, no a `/`: para quien navega en
 * inglés, `/` es cambiar de idioma sin avisar.
 */
export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const { locale: rawLocale } = await params;
  const locale = resolveLocale(rawLocale);
  setRequestLocale(locale);

  const { callbackUrl } = await searchParams;
  const requested = Array.isArray(callbackUrl) ? callbackUrl[0] : callbackUrl;

  return (
    <SignInOptions
      callbackUrl={
        safeReturnPath(requested) ?? getPathname({ locale, href: "/" })
      }
    />
  );
}
