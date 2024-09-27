import {
  PictureProps,
  PictureElementProps,
  makeGetPictureData,
  toPictureElementProps,
  ValueReference,
} from '../core';
import {
  PictureConfReact,
  PictureComponent,
  ServerSideConfReact,
} from './common';

const defaultRenderPicture = ({
  className,
  sources,
  img,
}: PictureElementProps) => (
  <picture className={className}>
    {sources.map((source, index) => (
      <source key={`${source.media ?? 'default'}-${index}`} {...source} />
    ))}
    <img {...img} />
  </picture>
);

export function makePicture(conf: PictureConfReact): PictureComponent;
export function makePicture(
  conf: ServerSideConfReact,
  confRef: ValueReference,
): PictureComponent;
export function makePicture(
  conf: PictureConfReact,
  confRef?: ValueReference,
): PictureComponent {
  const getPictureData = makeGetPictureData(conf);
  const renderPicture = conf.renderPicture ?? defaultRenderPicture;

  return function Picture(props: PictureProps) {
    return renderPicture(toPictureElementProps(getPictureData(props)));
  };
}
