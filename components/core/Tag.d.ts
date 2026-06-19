import * as React from 'react';

export interface TagProps extends React.HTMLAttributes<HTMLSpanElement> {
  shape?: 'sharp' | 'pill';
  /** When provided, renders a remove (×) button. */
  onRemove?: () => void;
  children?: React.ReactNode;
}

/** Removable token / filter chip. */
export function Tag(props: TagProps): JSX.Element;
