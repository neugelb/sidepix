import {
  PictureConf,
  PictureElementProps,
  PictureProps,
  ServerSideConf,
} from '../core';
import { ReactElement, FunctionComponent } from 'react';

export type PictureComponent = FunctionComponent<PictureProps>;

export type PictureConfReact = PictureConf & {
  renderPicture?: (props: PictureElementProps) => ReactElement;
};

export type ServerSideConfReact = ServerSideConf & {
  renderPicture?: (props: PictureElementProps) => ReactElement;
};
