import type { JSX as ReactJSX } from 'react';

/**
 * React 19 removed the global `JSX` namespace in favour of `React.JSX`.
 * Several third-party declarations (@dnd-kit, react-area) still reference the
 * global namespace, so re-export the React 19 types here until those packages
 * publish React 19-ready declarations.
 */
declare global {
  namespace JSX {
    type Element = ReactJSX.Element;
    type ElementClass = ReactJSX.ElementClass;
    type ElementAttributesProperty = ReactJSX.ElementAttributesProperty;
    type ElementChildrenAttribute = ReactJSX.ElementChildrenAttribute;
    type IntrinsicAttributes = ReactJSX.IntrinsicAttributes;
    type IntrinsicClassAttributes<T> = ReactJSX.IntrinsicClassAttributes<T>;
    type IntrinsicElements = ReactJSX.IntrinsicElements;
    type LibraryManagedAttributes<C, P> = ReactJSX.LibraryManagedAttributes<C, P>;
  }
}
