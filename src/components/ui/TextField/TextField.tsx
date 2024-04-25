"use client";

import { useId, forwardRef, useRef } from "react";
import type { ForwardedRef } from "react";
import { MdError } from "react-icons/md";
import type { TextFieldProps, TextFieldRefType } from "./TextField.d";
import { useImperativeHandle } from "react";
import {
  inputClassNameDefault,
  labelClassNameDefault,
  iconClassNameDefault,
  iconEndClassNameDefault,
  errorClassName,
} from "./classNames";

const TextField = forwardRef(TextFieldInner);
export default TextField;

function TextFieldInner(
  {
    isInvalid,
    label,
    icon,
    iconEnd,
    required,
    autoFocus,
    name,
    value,
    type,
    autoComplete,
    error,
    children,
    placeholder,
    pattern,
    ...moreProps
  }: TextFieldProps,
  ref: ForwardedRef<TextFieldRefType>
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => {
    return {
      focus() {
        inputRef.current?.focus();
      },
      blur() {
        inputRef.current?.blur();
      },
      value: inputRef.current?.value,
      scrollIntoView(options?: boolean | ScrollIntoViewOptions) {
        inputRef?.current?.scrollIntoView(options);
      },
    };
  });

  const id = useId();
  let inputClassName: string;

  inputClassName = `${inputClassNameDefault} ${icon && "pl-10"} ${
    iconEnd && "pr-10"
  }`;

  return (
    <div data-testid="TextField" className="mb-6 text-black dark:text-white">
      {label ? (
        <label htmlFor={id} className={`${labelClassNameDefault}`}>
          {label}
        </label>
      ) : null}

      <div className="relative">
        {icon ? (
          <div className={iconClassNameDefault} data-testid="icon-text-field">
            {icon}
          </div>
        ) : null}

        <input
          ref={inputRef}
          id={id}
          required={required}
          autoFocus={autoFocus}
          name={name}
          type={type}
          value={value}
          autoComplete={autoComplete}
          aria-invalid={isInvalid}
          aria-describedby={id}
          className={`${inputClassName}`}
          placeholder={placeholder}
          {...moreProps}
        />

        {iconEnd ? (
          <div
            aria-label="iconEnd"
            className={iconEndClassNameDefault}
            data-testid="iconEnd-text-field"
          >
            {iconEnd}
          </div>
        ) : null}
      </div>

      {error && (
        <div aria-label="iconError" className={errorClassName}>
          <MdError />
          {error}
        </div>
      )}
      {children}
    </div>
  );
}
