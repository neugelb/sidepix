import { GetPictureData } from './getPictureDataClientSide';
import {
  isServersideConf,
  PictureConf,
  ServerSideConf,
  ValueReference,
} from './PictureConf';

export * from './fetchUrl';
export * from './ImageFormat';
export * from './PictureConf';
export * from './PictureProps';
export * from './utils';

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
    ? require('./getPictureDataServerSide').makeGetPictureData(conf, confRef)
    : require('./getPictureDataClientSide').makeGetPictureData(conf);
}
