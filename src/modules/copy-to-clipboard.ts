// https://www.npmjs.com/package/copy-to-clipboard doesn't work in <dialog/>
export async function copy(text: string) {
  try {
    return navigator.clipboard.writeText(text);
  } catch {
    // Based on https://github.com/sudodoki/copy-to-clipboard/blob/main/index.js
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

    element.textContent = text;
    document.body.appendChild(element);
    range.selectNodeContents(element);
    selection?.addRange(range);

    const successful = document.execCommand('copy');
    if (!successful) {
      throw new Error(
        "Unable to copy to clipboard. Please, enable copy to clipboard permission in browser's settings"
      );
    }
    return;
  }
}
