export const rejectAfterDelay = (ms: number, requestName: string) =>
  new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Request timed out: ${requestName}`)), ms)
  );
