import * as React from 'react';

/**
 * @startingPoint section="Forms" subtitle="Inputs, select, checkbox, switch" viewport="700x300"
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  /** Error message — also turns the border red. */
  error?: string;
  iconLeft?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  wrapStyle?: React.CSSProperties;
}

/** Text input with optional label, leading icon, hint and error. */
export function Input(props: InputProps): JSX.Element;
