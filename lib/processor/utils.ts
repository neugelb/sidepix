import { ValueReference } from '../core';

export const ipcSocketRoot = process.env.SIDEPIX_SOCKET_ROOT ?? '/tmp/';
export const ipcAppSpace = (process.env.SIDEPIX_APP_NAME ?? 'sidepix') + '.';
export const ipcChannelId = process.env.SIDEPIX_PROCESSOR_ID ?? 'default';

export function requireValue<T>({ filePath, name }: ValueReference): T {
  const whole = require(filePath);
  return name !== undefined ? whole[name] : whole;
}
