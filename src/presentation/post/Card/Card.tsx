import { Link } from "~/i18n/navigation";
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
  userHref,
  footerChildren = null,
  actions = null,
  AnchorElement = "a",
  anchorProps = {},
  children,
}: CardProps) {
  const userName =
    user.displayName ?? user.name ?? user.username ?? user.email ?? "";
  /*
   * `min-w-0` y `truncate` van juntos y no son adorno: sin el primero, un hijo de flex se niega a
   * encogerse por debajo de su contenido, así que un nombre largo empuja la firma fuera de la
   * tarjeta en vez de cortarse. La columna más estrecha del sitio son 220px, y ahí un nombre de
   * cuatro palabras ya no cabe.
   */
  const signature = (
    <>
      <Avatar user={{ name: userName, image: user.image ?? user.photoURL }} />
      <div className="flex min-w-0 flex-col text-label text-text-support">
        <span className="truncate font-medium text-text-base">{userName}</span>
        <FormattedDate isoDateString={createdAt} />
      </div>
    </>
  );

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
      /* `@container` convierte a la tarjeta en su propia unidad de medida. La fila la monta el
         envoltorio de dentro y no esta superficie: una consulta de contenedor se resuelve contra
         el **antepasado** que declara `container-type`, nunca contra el elemento que lo declara, así
         que `@min-[320px]:flex` puesto aquí no se activaría nunca. */
      className={cn("@container overflow-hidden group", className)}
      style={style ?? {}}
    >
      {/* Foto a la izquierda y texto a la derecha en cuanto la tarjeta pasa de 320px, que es lo
          que ocurre cuando va sola en su renglón — el teléfono de pie. Ver `card-media`. */}
      <div className="@min-[320px]:flex @min-[320px]:items-start">
        <div className="card-media @min-[320px]:w-2/5 @min-[320px]:shrink-0">
          {media}
        </div>
        {/* El espaciado sale del estándar y no de márgenes en cada hijo: ver `cardSpacing.ts`. Con
          `gap`, un bloque que decide no pintarse —la línea de datos de un anuncio, que no tiene ni
          precio ni categoría— deja de ocupar sitio, cosa que un `mb-*` en el hermano de arriba no
          hacía: ahí estaba el hueco que quedaba bajo el título. */}
        {/* `min-w-0` es lo que deja que el título se parta en vez de empujar a la foto: un hijo
          de flex no baja de su contenido mientras no se le diga. */}
        <section className={cn(CARD_PADDING, CARD_STACK, "grow min-w-0")}>
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
            {userHref ? (
              <Link
                href={userHref}
                data-testid="card-author-profile"
                className="inline-flex items-center gap-3 hover:underline"
              >
                {signature}
              </Link>
            ) : (
              signature
            )}
            {actions ? <div className="ml-auto">{actions}</div> : null}
          </div>
        </section>
      </div>

      {footerChildren && (
        <footer className="flex flex-wrap p-2">{footerChildren}</footer>
      )}
    </Surface>
  );
}
