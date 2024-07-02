import React from 'react';
import { HStack } from 'src/ui/ui-kit/HStack';
import { VStack } from 'src/ui/ui-kit/VStack';

export const Stack = React.forwardRef<
  HTMLDivElement,
  {
    gap: number;
    direction: 'vertical' | 'horizontal';
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLDivElement>
>(({ gap, direction, children, ...props }, ref) => {
  return direction === 'horizontal' ? (
    <HStack ref={ref} gap={gap} {...props}>
      {children}
    </HStack>
  ) : (
    <VStack ref={ref} gap={gap} {...props}>
      {children}
    </VStack>
  );
});
