import React from 'react';
import {
  Tooltip as AriaTooltip,
  type TooltipProps as AriaTooltipProps,
} from '@ariakit/react/tooltip';
import { getRootDomNode } from 'src/ui/shared/getRootDomNode';

// Ariakit's Hovercard (used by Tooltip) accepts `portalElement` and forwards
// it to its internal `Portal`, but `TooltipOptions` does not re-expose it.
// Without this, body-portaled tooltip wrappers land as <body> grid items.
type TooltipExtraProps = {
  portalElement?:
    | HTMLElement
    | ((element: HTMLElement) => HTMLElement | null)
    | null;
};

export type TooltipProps = AriaTooltipProps & TooltipExtraProps;

export function Tooltip({
  portal = true,
  portalElement,
  ...rest
}: TooltipProps) {
  const resolvedPortalElement =
    portal && portalElement === undefined ? getRootDomNode() : portalElement;
  return (
    <AriaTooltip
      portal={portal}
      {...({ portalElement: resolvedPortalElement } as object)}
      {...rest}
    />
  );
}
