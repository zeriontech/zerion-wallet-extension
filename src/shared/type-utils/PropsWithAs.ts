import type {
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
  ElementType,
} from 'react';

export type PropsWithAs<As extends ElementType> = {
  as?: As;
} & ComponentPropsWithoutRef<As> &
  Partial<Pick<ComponentPropsWithRef<As>, 'ref'>>;
