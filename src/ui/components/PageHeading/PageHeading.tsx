import React from 'react';
import { UIText } from 'src/ui/ui-kit/UIText';

export function PageHeading({
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <UIText as="h1" kind="headline/h1" {...props} />;
}
