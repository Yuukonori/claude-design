import * as React from 'react';

export interface CheckboxProps {
  label?: React.ReactNode;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean, e: React.SyntheticEvent) => void;
  id?: string;
  style?: React.CSSProperties;
}

/** Square sharp-cornered checkbox; controlled or uncontrolled. */
export function Checkbox(props: CheckboxProps): JSX.Element;
