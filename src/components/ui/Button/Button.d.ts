import type { ReactNode } from "react";

export type ButtonProps = {
  className: string;
  disabled: boolean;
  size: "xs" | "sm" | "md" | "lg" | "xl";
  color: "green" | "orange" | "black";
  type: "button" | "submit" | "reset";
  children: ReactNode;
  onClick: MouseEventHandler<HTMLButtonElement>;
  startIcon: ReactNode;
  endIcon: ReactNode;
  text: string;
};
