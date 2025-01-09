/**
 * Simplified and adapted from https://github.com/jorgebucaran/hyperapp/blob/f185df6f2cfe10d7f8fb0940927138bce6b785d6/index.js#L67-L92
 * TODO: handle listeners (props starting with "on...")
 */
export function createNode(
  tagName: string,
  props: null | Record<string, unknown>,
  ...children: (string | HTMLElement | null)[]
): HTMLElement {
  if (tagName === 'svg') {
    throw new Error('Not implemented: svg');
  }
  const el = document.createElement(tagName);
  for (const key in props) {
    const value = props[key];
    if (key === 'style' && typeof value !== 'string') {
      throw new Error('style must be a string');
    }
    if (key in el) {
      // @ts-ignore
      el[key] = value == null ? '' : value;
    } else if (value == null || value === false) {
      el.removeAttribute(key);
    } else {
      el.setAttribute(key, value as string);
    }
  }
  for (const child of children) {
    if (child !== null) {
      el.appendChild(
        typeof child === 'string' ? document.createTextNode(child) : child
      );
    }
  }
  return el;
}
