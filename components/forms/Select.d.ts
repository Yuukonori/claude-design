import * as React from 'react';

export interface SelectOption { value: string; label: string; }

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  options?: (string | SelectOption)[];
  size?: 'sm' | 'md' | 'lg';
  wrapStyle?: React.CSSProperties;
}

/** Native select styled to the system with a chevron. */
export function Select(props: SelectProps): JSX.Element;
