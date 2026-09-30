/** Cuánto espera la invitación antes de aparecer: lo justo para que la página ya se haya visto. */
export const INVITE_DELAY_MS = 6000;

/** El nombre con que se recuerda, en este navegador, que la invitación ya se mostró. */
export const PILLARS_INVITE_ID = "pillars-overview-invite";

/**
 * Las rutas donde no se invita, como las devuelve `usePathname` de `~/i18n/navigation`: la
 * plantilla interna, igual en los dos idiomas.
 *
 * Son las de hacer algo concreto —comprar, pagar, seguir un pedido, publicar, administrar, entrar—:
 * ahí una invitación interrumpe en vez de ayudar.
 */
export const ROUTES_WITHOUT_INVITE: readonly string[] = [
  "/carrito",
  "/pedidos",
  "/pedido/[id]",
  "/pedido/[id]/repartidor/[token]",
  "/citas",
  "/publicar",
  "/editar/[slug]",
  "/cuenta",
  "/cuenta/agenda",
  "/cuenta/inventario",
  "/admin/catalogo",
  "/admin/productos",
  "/admin/moderacion",
  "/auth/signin",
];

const PILLARS_ROUTE = "/pilares/[[...slug]]";

/**
 * Si en esta página cabe la invitación. La portada de los pilares no invita porque ya tiene la
 * animación debajo del héroe; las páginas de cada pilar sí, porque no la tienen.
 */
export function invitesOn(
  pathname: string,
  slug: string | readonly string[] | undefined,
): boolean {
  if (pathname === PILLARS_ROUTE) return slug !== undefined && slug.length > 0;
  return !ROUTES_WITHOUT_INVITE.includes(pathname);
}
