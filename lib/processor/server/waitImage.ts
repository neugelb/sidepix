import { waitUntilReady } from './registry';
import { promises } from 'fs';

export type WaitImageOptions = {
  usePolling: {
    interval: number;
    timeout: number;
  };
};

export type WaitImage = (
  path: string,
  options?: WaitImageOptions,
) => Promise<void>;

export const waitImage: WaitImage = (path, options) => {
  try {
    return waitUntilReady(path);
  } catch (err) {
    if (options?.usePolling !== undefined) {
      const { interval, timeout } = options.usePolling;

      return new Promise((res, rej) => {
        const intervalId = setInterval(async () => {
          try {
            promises.stat(path);
            clearTimeout(timeoutId);
            res();
          } catch {}
        }, interval);

        const timeoutId = setTimeout(() => {
          clearInterval(intervalId);
          rej();
        }, timeout);
      });
    } else {
      throw err;
    }
  }
};
