import type React from 'react';
import { useEffect } from 'react';
import { useQueryClient } from 'react-query';

export function InvalidateQueryCache({ children }: React.PropsWithChildren) {
  const client = useQueryClient();
  useEffect(() => {
    client.invalidateQueries();
  }, [client]);
  return children as JSX.Element;
}
