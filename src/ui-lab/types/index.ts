import type React from 'react';

export interface Readme {
  id?: string;
  name: string;
  description: React.FunctionComponent | null;
  component: React.FunctionComponent;
}
