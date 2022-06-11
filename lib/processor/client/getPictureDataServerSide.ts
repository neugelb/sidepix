import {
  ValueReference,
  isServersideConf,
  PictureConf,
  ServerSideConf,
} from '../../core';
import { withImageProcessing } from './withImageProcessing';
import {
  GetPictureData,
  makeGetPictureData as makeGetPictureDataClient,
} from '../../core/getPictureDataClientSide';

export function makeGetPictureData(conf: PictureConf): GetPictureData;
export function makeGetPictureData(
  conf: ServerSideConf,
  confRef: ValueReference,
): GetPictureData;
export function makeGetPictureData(
  conf: PictureConf,
  confRef?: ValueReference,
): GetPictureData {
  if (isServersideConf(conf) && confRef !== undefined) {
    return withImageProcessing(makeGetPictureDataClient)(conf, confRef);
  } else {
    return makeGetPictureDataClient(conf);
  }
}
