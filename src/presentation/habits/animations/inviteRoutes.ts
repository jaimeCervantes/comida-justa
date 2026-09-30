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
 * Las páginas de pilar que ya tienen su propia animación bajo el héroe. Ahí la invitación competiría
 * con ella —y, con el sonido encendido, se oirían las dos—, así que no aparece.
 *
 * Es una lista aparte y no se deduce de `PILLAR_STORIES` porque la invitación va en todas las
 * páginas del sitio: importar aquí las animaciones las metería en cada una. `pillarStories.test.ts`
 * comprueba que las dos listas coinciden.
 */
export const PILLAR_SLUGS_WITH_ANIMATION: readonly string[] = ["sueno"];

/**
 * Si en esta página cabe la invitación. La portada de los pilares no invita porque ya tiene la
 * animación debajo del héroe, y la página de un pilar tampoco en cuanto tiene la suya.
 */
export function invitesOn(
  pathname: string,
  slug: string | readonly string[] | undefined,
): boolean {
  if (pathname === PILLARS_ROUTE) {
    if (slug === undefined || slug.length === 0) return false;
    const pillarSlug = typeof slug === "string" ? slug : slug[0];
    return !PILLAR_SLUGS_WITH_ANIMATION.includes(pillarSlug);
  }
  return !ROUTES_WITHOUT_INVITE.includes(pathname);
}
