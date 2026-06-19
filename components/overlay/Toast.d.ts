import * as React from 'react';

export interface ToastProps {
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  title?: React.ReactNode;
  message?: React.ReactNode;
  onClose?: () => void;
  style?: React.CSSProperties;
}

/** Transient notification with a left status rule. */
export function Toast(props: ToastProps): JSX.Element;
