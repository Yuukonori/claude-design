import * as React from 'react';

export interface DialogProps {
  open: boolean;
  onClose?: () => void;
  /** Title is rendered in the serif display face. */
  title?: React.ReactNode;
  description?: React.ReactNode;
  footer?: React.ReactNode;
  width?: number;
  children?: React.ReactNode;
}

/** Centered modal over a blurred scrim; title uses the serif display. */
export function Dialog(props: DialogProps): JSX.Element | null;
