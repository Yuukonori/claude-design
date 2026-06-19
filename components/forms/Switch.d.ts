import * as React from 'react';

export interface SwitchProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, e: React.SyntheticEvent) => void;
  style?: React.CSSProperties;
}

/** Pill toggle for instant on/off settings. */
export function Switch(props: SwitchProps): JSX.Element;
