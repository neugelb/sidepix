import { isObjectLike, ValueReference } from '../core';
import { types } from 'util';

export const ipcSocketRoot = process.env.SIDEPIX_SOCKET_ROOT ?? '/tmp/';
export const ipcAppSpace = (process.env.SIDEPIX_APP_NAME ?? 'sidepix') + '.';
export const ipcChannelId = process.env.SIDEPIX_PROCESSOR_ID ?? 'default';

export function requireValue<T>({ filePath, name }: ValueReference): T {
  const whole = require(filePath);
  return name !== undefined ? whole[name] : whole;
}

export function executeConditionalCallbacks<ArgT>(
  callbacks: ((arg: ArgT) => boolean)[],
  arg: ArgT,
): void {
  let i = 0;
  while (i < callbacks.length) {
    const cb = callbacks[i];
    if (cb(arg)) {
      callbacks.splice(i, 1);
    } else {
      i++;
    }
  }
}

export function executeCallbacks(callbacks: (() => void)[]): void {
  while (callbacks.length > 0) {
    callbacks.shift()?.();
  }
}

export type SystemError = Error & { code: string };

export function isSystemError(x: unknown): x is SystemError {
  return (
    isObjectLike(x) && types.isNativeError(x) && typeof x.code === 'string'
  );
}
