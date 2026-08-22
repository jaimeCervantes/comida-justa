import { cn } from "~/presentation/design_system/styling/merge-class-names";
import ImageWithSkeleton from "~/presentation/media/ImageWithSkeleton/ImageWithSkeleton";

/**
 * La foto pequeña de un producto en una lista: carrito, pedido, cualquier renglón.
 *
 * **Decorativa a propósito.** En todos sus usos el nombre del producto va escrito justo al lado, así
 * que un `alt` con el título haría que un lector de pantalla lo dijera dos veces. Si algún día hace
 * falta una versión que sí nombre lo que enseña, será otro componente y no un prop más.
 *
 * **Sin URL no pinta nada** —ni un hueco, ni un marco vacío—: quien la usa la pone junto al texto,
 * que se lee igual de bien solo. Es la misma regla de `WhatsappButton` con su `href` nulo: la
 * decisión de "no hay nada que enseñar" vive en un sitio y no en cada pantalla.
 *
 * No es del design system porque `next/image` necesita que el host esté declarado en
 * `next.config`, o sea que sabe de dónde salen las imágenes de esta aplicación.
 */
export default function Thumbnail({
  url,
  size = 48,
  className,
  testId = "thumbnail",
}: {
  url: string | null | undefined;
  /** Lado en píxeles. Cuadrada y recortada: en una lista lo que importa es reconocerla. */
  size?: number;
  className?: string;
  testId?: string;
}) {
  if (!url) return null;

  return (
    <ImageWithSkeleton
      src={url}
      alt=""
      aria-hidden
      width={size}
      height={size}
      /* El hueco se sabe exactamente —es cuadrado y mide `size`—, así que no hay que adivinarlo: el
         navegador pide esa variante y no una de 1920 para enseñarla a 112. */
      sizes={`${size}px`}
      data-testid={testId}
      frameClassName="shrink-0 rounded-chip"
      className={cn("rounded-chip object-cover", className)}
      style={{ width: size, height: size }}
    />
  );
}
