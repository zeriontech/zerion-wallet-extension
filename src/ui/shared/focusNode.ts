export function focusNode<T extends HTMLElement>(node: T | null) {
  node?.focus();
}
