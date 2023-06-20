export async function wait<T = void>(ms = 1000, result?: T) {
  return new Promise<T>((resolve) =>
    setTimeout(() => resolve(result as T), ms)
  );
}
