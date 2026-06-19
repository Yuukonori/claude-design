import * as React from 'react';

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string;
  /** Used for initials fallback and alt text. */
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/** Circular identity token; falls back to initials. */
export function Avatar(props: AvatarProps): JSX.Element;
