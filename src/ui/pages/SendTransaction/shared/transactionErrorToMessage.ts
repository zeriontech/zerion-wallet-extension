import { getError } from 'src/shared/errors/getError';

export function txErrorToMessage(error?: unknown | Error) {
  const fallbackString = 'Unknown Error';
  if (!error) {
    return fallbackString;
  }
  try {
    const result = getError(error).message;

    if (result === 'DeniedByUser') {
      return '';
    }

    if (result.toLowerCase() === 'insufficient funds for gas * price + value') {
      return 'Error: Insufficient funds';
    }

    return `Error: ${result}`;
  } catch (e) {
    return `Error: ${fallbackString}`;
  }
}
