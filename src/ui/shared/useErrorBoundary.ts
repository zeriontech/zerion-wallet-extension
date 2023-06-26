import { useCallback, useState } from 'react';
import { getError } from 'src/shared/errors/getError';

export function useErrorBoundary() {
  const [_, setState] = useState();
  return useCallback(
    (error: unknown) =>
      setState(() => {
        throw getError(error);
      }),
    []
  );
}
