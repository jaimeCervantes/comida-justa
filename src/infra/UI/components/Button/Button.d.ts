import type { ReactNode, ButtonHTMLAttributes, MouseEventHandler } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  className?: string; // made optional
  disabled?: boolean; // made optional
  size?: "xs" | "sm" | "md" | "lg" | "xl"; // made optional
  color?: "green" | "orange" | "black" | "white" | "default"; // made optional
  type?: "button" | "submit" | "reset";
  children?: ReactNode; // made optional
  onClick?: (
    event: React.MouseEvent<HTMLButtonElement>
  ) => void | Promise<void>; // made optional
  startIcon?: ReactNode; // made optional
  endIcon?: ReactNode; // made optional
  isLoading?: boolean; // made optional
  showLoader?: boolean;
};
