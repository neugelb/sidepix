export * from './core';

import {
  GetPictureData,
  isServersideConf,
  PictureConf,
  ServerSideConf,
  ValueReference,
} from './core';
import type { WaitImage } from './processor/server/waitImage';

export function makeGetPictureData(conf: PictureConf): GetPictureData;
export function makeGetPictureData(
  conf: ServerSideConf,
  confRef: ValueReference,
): GetPictureData;
export function makeGetPictureData(
  conf: PictureConf,
  confRef?: ValueReference,
): GetPictureData {
  return typeof window === 'undefined' && isServersideConf(conf)
    ? require('./processor/client').makeGetPictureData(conf, confRef)
    : require('./core').makeGetPictureData(conf);
}

export const waitImage: WaitImage =
  typeof window === 'undefined'
    ? require('./processor/client').waitImage
    : () => Promise.reject();
