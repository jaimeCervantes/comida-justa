import type { ChangeEventHandler, ReactNode } from "react";

export type TextFieldProps = {
  isInvalid?: true | false;
  label?: string;
  icon?: JSX.Element;
  iconEnd?: JSX.Element;
  required?: true | false;
  autoFocus?: true | false;
  name: string;
  value?: string;
  type: string;
  autoComplete?: string;
  error?: string | null | undefined;
  children?: ReactNode;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  placeholder?: string;
  pattern?: string;
};

export type TextFieldRefType = {
  focus: () => void;
  blur: () => void;
  value: string | undefined;
  scrollIntoView: (options?: boolean | ScrollIntoViewOptions) => void;
};
