"use client";
import type { ButtonProps } from "./Button";
import classNames from "classnames";
import { BiLoaderAlt } from "react-icons/bi";
import { useState } from "react";

const styleBtn = {
  green: "bg-pw-green text-white hover:bg-pw-green/80",
  orange: "bg-pw-orange text-white hover:bg-pw-orange/80",
  black: "bg-pw-black text-white hover:bg-pw-black/80",
  white: "bg-pw-white text-black hover:bg-pw-white/80",
  default: "bg-pw-gray text-white hover:bg-pw-gray/80",
};

const styleSizeBtn = {
  xs: "btn-xs px-2 py-2 text-xs",
  sm: "btn-sm px-2 py-2 text-sm",
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
  showLoader,
  ...moreProps
}: Partial<ButtonProps>) {
  const [internalLoading, setInternalLoading] = useState(false);

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (showLoader && onClick) {
      setInternalLoading(true);
      try {
        await onClick(e);
      } finally {
        setInternalLoading(false);
      }
    } else if (onClick) {
      onClick(e);
    }
  };

  const buttonClassName = classNames(
    "relative rounded-sm",
    className,
    styleBtn[color || "default"],
    styleSizeBtn[size],
  );

  const btnContentClasses = classNames("flex gap-2 items-center", {
    "ml-1": startIcon,
    "mr-1": endIcon,
  });

  const isBtnLoading = isLoading || internalLoading;

  return (
    <button
      onClick={handleClick}
      className={buttonClassName}
      disabled={disabled || isBtnLoading}
      type={type}
      {...moreProps}
    >
      {startIcon && startIcon}
      <span className={btnContentClasses}>
        {children}
        {isBtnLoading ? (
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
