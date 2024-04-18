import type { ElementType } from "react";

export type CardProps = {
  title: string;
  image: ImageCardProp;
  createdAt: Date;
  createdAtLocale: string;
  className?: string;
  Container?: ElementType;
  style?: Object;
  user?: {
    displayName?: string;
    email?: string;
    photoURL?: string;
    phoneNumber?: string;
  };
  footerChildren?: JSX.Element | string | null | undefined;
  AnchorElement?: ElementType;
  anchorProps: { [key: string]: string };
  children: React.ReactNode;
};

export type ImageCardProp = {
  src: string;
  alt: string;
  width?: number | `${number}`;
  height?: number | `${number}`;
  priority?: boolean;
  loading?: "eager" | "lazy";
};
