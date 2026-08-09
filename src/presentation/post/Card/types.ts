import type { ElementType } from "react";

export type CardProps = {
  title: string;
  /**
   * Lo que se pinta arriba de la tarjeta, ya renderizado.
   *
   * Declaraba además `ElementType`, que era una mentira: un *tipo* de componente no se puede pintar
   * como hijo —React no lo instancia—, así que ese miembro de la unión describía algo que habría
   * fallado en tiempo de ejecución. Nadie lo usaba; salió a la luz al tipar `children` en serio en
   * `Surface`.
   */
  media?: React.ReactNode;
  createdAt: string;
  className?: string;
  Container?: ElementType;
  style?: React.CSSProperties;
  user?: {
    displayName?: string;
    email?: string;
    photoURL?: string;
    phoneNumber?: string;
  };
  footerChildren?: React.JSX.Element | string | undefined | null;
  /**
   * Lo que se puede hacer con la tarjeta **sin abrirla**, alineado al final del renglón de la firma.
   *
   * Va ahí y no sobre la imagen porque ese renglón ya es el borde inferior de la tarjeta —lo separa
   * una línea— y porque encima de la foto taparía justo lo que se mira para decidir.
   */
  actions?: React.ReactNode;
  AnchorElement?: ElementType;
  anchorProps?: { [key: string]: string };
  children?: React.ReactNode;
};

export type ImageCardProp = {
  src: string;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  priority?: boolean;
  loading?: "eager" | "lazy";
};
