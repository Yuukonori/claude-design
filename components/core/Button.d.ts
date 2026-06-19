import * as React from 'react';

/**
 * @startingPoint section="Core" subtitle="Buttons — solid, outline, ghost, danger" viewport="700x160"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style. `solid` is white-on-near-black (primary action). */
  variant?: 'solid' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  /** Leading icon node (e.g. a Lucide <i data-lucide> or SVG). */
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
}

/** Primary action control for Lattice. */
export function Button(props: ButtonProps): JSX.Element;
