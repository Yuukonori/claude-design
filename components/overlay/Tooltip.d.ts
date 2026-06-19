import * as React from 'react';

export interface TooltipProps {
  label: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  style?: React.CSSProperties;
}

/** Hover label; high-contrast (white surface, dark text). */
export function Tooltip(props: TooltipProps): JSX.Element;
