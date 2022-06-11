export * from './core';

import {
  GetPictureData,
  isServersideConf,
  PictureConf,
  ServerSideConf,
  ValueReference,
} from './core';

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
