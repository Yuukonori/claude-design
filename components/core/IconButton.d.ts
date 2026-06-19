import * as React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'outline' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  /** Pressed/selected state (toolbar toggles). */
  active?: boolean;
  /** Accessible label / tooltip text. */
  title?: string;
  children?: React.ReactNode;
}

/** Square, icon-only action button (toolbars, panel headers). */
export function IconButton(props: IconButtonProps): JSX.Element;
