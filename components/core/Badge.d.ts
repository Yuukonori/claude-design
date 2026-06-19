import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  children?: React.ReactNode;
}

/** Small status label; colored tones are muted and used only for status. */
export function Badge(props: BadgeProps): JSX.Element;
