import * as React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Adds hover border feedback (use for clickable cards). */
  interactive?: boolean;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/** Flat bordered surface container — no shadow, 0 radius. */
export function Card(props: CardProps): JSX.Element;
