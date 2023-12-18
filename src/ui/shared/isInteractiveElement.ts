/**
 * List of interactive elements adapted from here:
 * https://www.w3.org/TR/2016/CR-html51-20160621/dom.html#interactive-content
 */
const interactiveTagNames = new Set([
  'A',
  'AUDIO',
  'BUTTON',
  'DETAILS',
  'EMBED',
  'IFRAME',
  'INPUT',
  'KEYGEN',
  'LABEL',
  'SELECT',
  'TEXTAREA',
  'VIDEO',
]);

export function isInteractiveElement(node: EventTarget) {
  return node instanceof HTMLElement && interactiveTagNames.has(node.tagName);
}
