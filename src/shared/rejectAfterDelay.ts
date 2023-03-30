export const rejectAfterDelay = (ms: number) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Request timed out')), ms)
  );
