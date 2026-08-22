import { cn } from "~/presentation/design_system/styling/merge-class-names";
import {
  CARD_PADDING,
  CARD_STACK,
} from "~/presentation/design_system/surfaces/cardSpacing";
import { Surface } from "~/presentation/design_system/surfaces/Surface";
import { Heading } from "~/presentation/design_system/typography/Heading";
import Avatar from "~/presentation/user/Avatar";
import FormattedDate from "./FormattedDate";
import type { CardProps } from "./types";

export default function Card({
  title,
  media,
  createdAt,
  className,
  Container = "article",
  style = {},
  user = {},
  footerChildren = null,
  actions = null,
  AnchorElement = "a",
  anchorProps = {},
  children,
}: CardProps) {
  return (
    <Surface
      as={Container}
      radius="card"
      background="raised"
      border="subtle"
      elevation="sm"
      interactive
      /* El hover dibujaba un anillo naranja de 2px alrededor de la tarjeta. Con el papel cálido de
         v2 eso es un grito: la tarjeta pasaba de reposo a marco de color sin escala intermedia.
         Ahora sube de elevación —`sm` a `md`, que es lo que hace `interactive`— y el título toma la
         tinta de acento. Sugiere que se puede pulsar, en vez de anunciarlo. */
      className={cn("overflow-hidden group", className)}
      style={style ?? {}}
    >
      {media}
      {/* El espaciado sale del estándar y no de márgenes en cada hijo: ver `cardSpacing.ts`. Con
          `gap`, un bloque que decide no pintarse —la línea de datos de un anuncio, que no tiene ni
          precio ni categoría— deja de ocupar sitio, cosa que un `mb-*` en el hermano de arriba no
          hacía: ahí estaba el hueco que quedaba bajo el título. */}
      <section className={cn(CARD_PADDING, CARD_STACK, "grow")}>
        <Heading
          level={3}
          size="xs"
          className="group-hover:text-highlight transition-colors"
        >
          <AnchorElement {...anchorProps}>{title}</AnchorElement>
        </Heading>
        {children}
        {/* `mt-auto` empuja la firma al fondo, que es lo que alinea los pies de una fila de
            tarjetas de altura distinta. El `pt-4` se queda: el borde necesita aire propio, más
            que la separación de la pila. */}
        <div className="mt-auto flex justify-start gap-3 items-center pt-4 border-t border-separator">
          <Avatar user={user} />
          <div className="flex flex-col text-label text-text-support">
            <span className="font-medium text-text-base">
              {user.displayName}
            </span>
            <FormattedDate isoDateString={createdAt} />
          </div>
          {actions ? <div className="ml-auto">{actions}</div> : null}
        </div>
      </section>

      {footerChildren && (
        <footer className="flex flex-wrap p-2">{footerChildren}</footer>
      )}
    </Surface>
  );
}
