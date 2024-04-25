"use client";
import type { ButtonProps } from "./Button.d";
import classNames from "classnames";
import { BiLoaderAlt } from "react-icons/bi";

const styleBtn = {
  green: "bg-pw-green text-white hover:bg-pw-green/80",
  orange: "bg-pw-orange text-white hover:bg-pw-orange/80",
  black: "bg-pw-black text-white hover:bg-pw-black/80",
  white: "bg-pw-white text-black hover:bg-pw-white/80",
  default: "bg-pw-gray text-white hover:bg-pw-gray/80",
};

const styleSizeBtn = {
  xs: "btn-xs px-3 py-2 text-xs",
  sm: "btn-sm px-3 py-2 text-sm",
  md: "btn-md px-5 py-3 text-base",
  lg: "btn-lg px-6 py-4 text-base",
  xl: "btn-xl px-7 py-5 text-base",
};

export default function Button({
  className,
  size = "md",
  disabled,
  color,
  type,
  onClick,
  children,
  startIcon,
  endIcon,
  isLoading,
  ...moreProps
}: Partial<ButtonProps>) {
  const buttonClassName = classNames(
    "relative rounded-sm",
    className,
    styleBtn[color || "default"],
    styleSizeBtn[size]
  );

  const btnContentClasses = classNames("flex gap-2 items-center", {
    "ml-1": startIcon,
    "mr-1": endIcon,
  });

  return (
    <button
      onClick={onClick}
      className={buttonClassName}
      disabled={disabled || isLoading}
      type={type}
      {...moreProps}
    >
      {startIcon && startIcon}
      <span className={btnContentClasses}>
        {children}
        {isLoading ? (
          <BiLoaderAlt
            className="motion-safe:animate-spin h-5 w-5"
            title="Cargando..."
          />
        ) : (
          ""
        )}
      </span>

      {endIcon && endIcon}
    </button>
  );
}
