import { queryClient } from './requests/queryClient';

export function zeroizeAfterSubmission() {
  /** Call this function to remove sensitive input values from runtime memory */
  const inputs = document.querySelectorAll('input[type=password]');
  inputs.forEach((input) => {
    if (input instanceof HTMLInputElement) {
      input.value = '';
    }
  });
  queryClient.getMutationCache().clear();
}
