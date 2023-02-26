import flatMap from 'lodash/flatMap';
import toPairs from 'lodash/toPairs';
import { formatToMimeType } from './ImageFormat';
import {
  CreateFileName,
  defaultCreateFileName,
  PictureConf,
  ServerSideConf,
  ValueReference,
} from './PictureConf';
import { normalizeSources, PictureData, PictureProps } from './PictureProps';

export type GetPictureData = (props: PictureProps) => PictureData;

export function makeGetPictureData(conf: PictureConf): GetPictureData;
export function makeGetPictureData(
  conf: ServerSideConf,
  confRef: ValueReference,
): GetPictureData;
export function makeGetPictureData(
  conf: PictureConf,
  confRef?: ValueReference,
): GetPictureData {
  const createFileUrl: CreateFileName = (...args) =>
    conf.assetsBaseUrl +
    '/' +
    (conf.createFileName ?? defaultCreateFileName)(...args);

  return (props) => {
    const { sources, fallback } = normalizeSources(conf, props.sources);

    const processedSources = flatMap(
      toPairs(sources),
      ([
        media,
        { src, formats, aspectRatio, focalPoint, sizes, widths },
      ]): PictureData['sources'][number][] => {
        return formats.map((format) => ({
          srcset: (widths ?? [undefined]).map((width) => ({
            url: createFileUrl({
              src,
              format,
              aspectRatio,
              focalPoint,
              width,
            }),
            width,
          })),
          media,
          focalPoint,
          aspectRatio,
          sizes,
          mimeType: formatToMimeType(format),
        }));
      },
    );

    return {
      className: props.className,
      sources: processedSources,
      fallback: createFileUrl(fallback),
      alt: props.alt,
    };
  };
}
