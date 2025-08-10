import type { HTMLDialogElementInterface } from './HTMLDialogElementInterface';

export function showConfirmDialog(
  dialog: HTMLDialogElementInterface
): Promise<string> {
  dialog.showModal();
  return new Promise((resolve, reject) => {
    function handler() {
      if (!dialog.returnValue || dialog.returnValue === 'cancel') {
        reject(dialog.returnValue);
      } else {
        resolve(dialog.returnValue);
      }
      dialog.returnValue = '';
      dialog.removeEventListener('close', handler);
      dialog.removeEventListener('cancel', handler);
    }
    dialog.addEventListener('close', handler);
    dialog.addEventListener('cancel', handler);
  });
}

export function showConfirmDialogWithCondition(
  dialog: HTMLDialogElementInterface,
  condition: boolean
): Promise<string | void> {
  if (condition) {
    return showConfirmDialog(dialog);
  }
  return Promise.resolve();
}
