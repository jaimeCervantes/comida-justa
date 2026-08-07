const date = new Date();

export const props = {
  title: "Ensala con frutas",
  description:
    "Ensalada de lechuga italiana, cebolla morada, agucate, mango, piña, almendras, chia, semilla de calabaza y arandanos",
  price: 50,
  /*
   * Cadena ISO, no `Date`. `Card` se lo pasa a `FormattedDate` como `isoDateString`, que lo vuelca
   * tal cual en el atributo `dateTime` del `<time>`: con un `Date` el test seguía en verde —
   * `new Date(unDate)` funciona— pero el atributo salía con "Wed Aug 07 2026 …" en vez de una fecha
   * válida. Es de los fallos que solo se ven cuando `tsc` mira los tests.
   */
  createdAt: date.toISOString(),
  createdAtLocale: date.toLocaleString("es-MX", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  }),
  /*
   * `as const` y una ruta del sitio: el `Link` de `~/i18n/navigation` lleva rutas tipadas, así que
   * `href` tiene que ser una de ellas y no un `string` cualquiera —sin `as const` TypeScript la
   * ensancha a `string` y el spread dentro de `<Link>` deja de encajar—. La externa que había aquí
   * además no representaba nada real: una tarjeta enlaza a una publicación, no a Google.
   */
  anchorProps: { href: "/productos" } as const,
};
