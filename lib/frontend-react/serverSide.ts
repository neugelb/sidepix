import { ValueReference, isServersideConf } from '../core';
import { withImageProcessing } from '../processor';
import {
  PictureComponent,
  PictureConfReact,
  ServerSideConfReact,
} from './common';
import { makePicture as makePictureClient } from './clientSide';

export function makePicture(conf: PictureConfReact): PictureComponent;
export function makePicture(
  conf: ServerSideConfReact,
  confRef: ValueReference,
): PictureComponent;
export function makePicture(
  conf: PictureConfReact,
  confRef?: ValueReference,
): PictureComponent {
  if (isServersideConf(conf) && confRef !== undefined) {
    return withImageProcessing(makePictureClient)(conf, confRef);
  } else {
    return makePictureClient(conf);
  }
}
