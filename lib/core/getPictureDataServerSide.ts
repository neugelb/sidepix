import { ValueReference, isServersideConf } from '.';
import { withImageProcessing } from '../processor';
import { PictureConf, ServerSideConf } from './PictureConf';
import {
  GetPictureData,
  makeGetPictureData as makeGetPictureDataClient,
} from './getPictureDataClientSide';

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
