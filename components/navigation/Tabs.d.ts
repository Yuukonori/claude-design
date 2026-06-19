import * as React from 'react';

export interface TabItem { value: string; label: string; }

export interface TabsProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  tabs?: (string | TabItem)[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

/** Underline tab bar; controlled or uncontrolled. */
export function Tabs(props: TabsProps): JSX.Element;
