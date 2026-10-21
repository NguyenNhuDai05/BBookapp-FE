// Serialize credential pairs without holding a lock during network requests.
let tail: Promise<unknown> = Promise.resolve();
export function withSessionStorage<T>(operation: () => Promise<T>): Promise<T> {
  const result = tail.then(operation, operation);
  tail = result.then(() => undefined, () => undefined);
  return result;
}
