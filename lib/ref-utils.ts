import type { RefObject } from "react";

export function isRefReady<T>(ref: RefObject<T | null>): ref is RefObject<T> {
  return ref.current !== null;
}

export function withRefCheck<T, R>(
  ref: RefObject<T | null>,
  callback: (element: T) => R
): R | null {
  if (ref.current) {
    return callback(ref.current);
  }
  return null;
}

export async function waitForRef<T>(
  ref: RefObject<T | null>,
  timeout = 5000
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (ref.current) {
      resolve(ref.current);
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error("Ref timeout"));
    }, timeout);

    const checkRef = () => {
      if (ref.current) {
        clearTimeout(timeoutId);
        resolve(ref.current);
      } else {
        setTimeout(checkRef, 10);
      }
    };

    checkRef();
  });
}
