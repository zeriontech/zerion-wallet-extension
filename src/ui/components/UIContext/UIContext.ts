import React from 'react';

export const defaultUIContextValue = {
  uiScrollRootElement: document.body,
} as const;

export const UIContext = React.createContext(defaultUIContextValue);
