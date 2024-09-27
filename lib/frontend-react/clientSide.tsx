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
    {sources.map((source) => {
      let key = source.media ?? 'default';
      if (source.type !== undefined) {
        key += `-${source.type}`;
      }
      return <source key={key} {...source} />;
    })}
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
