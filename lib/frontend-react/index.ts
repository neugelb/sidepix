import { isServersideConf, ValueReference } from '../core';
import {
  PictureComponent,
  PictureConfReact,
  ServerSideConfReact,
} from './common';
export { PictureConfReact } from './common';

export function makePicture(conf: PictureConfReact): PictureComponent;
export function makePicture(
  conf: ServerSideConfReact,
  confRef: ValueReference,
): PictureComponent;
export function makePicture(
  conf: PictureConfReact,
  confRef?: ValueReference,
): PictureComponent {
  return typeof window === 'undefined' && isServersideConf(conf)
    ? require('./serverSide').makePicture(conf, confRef)
    : require('./clientSide').makePicture(conf);
}
