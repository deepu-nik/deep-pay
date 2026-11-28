export const FIRESTORE_REQUEST_TIMEOUT_MS = 10_000;

export async function withFirestoreTimeout<T>(
  promise: Promise<T>,
  message: string,
  timeoutMs = FIRESTORE_REQUEST_TIMEOUT_MS,
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
