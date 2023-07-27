// https://www.npmjs.com/package/copy-to-clipboard doesn't work in <dialog/>
// we are using modern Clipboard API instead of the old approach with creating temporary html element

function findOpenedModalDialog() {
  /**
   * "Modal" dialog is an html <dialog> with "open" property set to `true`
   * and an unset "open" attribute:
   * https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog#open
   */
  let element = document.activeElement;
  while (element) {
    if (
      element.tagName === 'DIALOG' &&
      (element as HTMLDialogElement).open &&
      !element.getAttribute('open')
    ) {
      return element;
    }
    element = element.parentElement;
  }
  return null;
}

export function copy(text: string) {
  try {
    return navigator.clipboard.writeText(text);
  } catch {
    // Based on https://github.com/sudodoki/copy-to-clipboard/blob/main/index.js
    // we need fallback here because Clipboard API can be disabled by browser's settings
    // also it is turned off by default in Firefox
    const range = document.createRange();
    const selection = document.getSelection();
    const element = document.createElement('span');

    element.ariaHidden = 'true';
    element.style.all = 'unset';
    element.style.position = 'fixed';
    element.style.top = '0';
    element.style.clip = 'rect(0, 0, 0, 0)';
    element.style.whiteSpace = 'pre';
    element.style.userSelect = 'text';

    let root: Element | null = null;
    try {
      element.textContent = text;
      root = findOpenedModalDialog() || document.body;
      root.appendChild(element);
      range.selectNodeContents(element);
      selection?.removeAllRanges();
      selection?.addRange(range);

      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Unable to copy to clipboard.');
      }
    } finally {
      if (selection) {
        if (typeof selection.removeRange == 'function') {
          selection.removeRange(range);
        } else {
          selection.removeAllRanges();
        }
      }

      if (root) {
        root.removeChild(element);
      }
    }
  }
}
