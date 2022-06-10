import mapValues from 'lodash/mapValues';
import values from 'lodash/values';
import max from 'lodash/max';
import flatMap from 'lodash/flatMap';
import toPairs from 'lodash/toPairs';
import uniq from 'lodash/uniq';
import { clean } from './utils';
import { fileNameToFormat, ImageFormat } from './ImageFormat';
import {
  CreateFileName,
  defaultCreateFileName,
  PictureConf,
  ServerSideConf,
} from './PictureConf';

export type PictureProps = {
  className?: string;
  sources: {
    [media: string]: PictureSource;
    default: PictureSourceDefault;
  };
  alt?: string;
};

export type PictureSourceDefault = {
  src: string;
  formats?: ImageFormat[];
  aspectRatio?: number;
  focalPoint?: [number, number];
  sizes?: {
    [media: string]: number | string;
    default: number | string;
  };
  widths?: number[];
};

export type PictureSource = Partial<PictureSourceDefault>;

export type PictureData = {
  className?: string;
  sources: {
    srcset: {
      url: string;
      width?: number;
    }[];
    media: string;
    focalPoint?: [number, number];
    aspectRatio?: number;
    sizes?: {
      [media: string]: number | string;
      default: number | string;
    };
    mimeType?: string;
  }[];
  fallback: string;
  alt?: string;
};

export function normalizeSources(
  conf: PictureConf,
  sources: PictureProps['sources'],
): {
  sources: {
    [M in keyof PictureProps['sources']]: PictureProps['sources'][M] & {
      src: string;
      formats: ImageFormat[];
    };
  };
  fallback: { src: string; format: ImageFormat; width?: number };
} {
  const defaultSrcFormat = fileNameToFormat(sources.default.src);

  return {
    sources: mapValues(sources, (source) => {
      const srcFormat =
        source.src !== undefined
          ? fileNameToFormat(source.src)
          : fileNameToFormat(sources.default.src);
      const confFormats =
        srcFormat !== undefined ? conf.targetFormats?.(srcFormat) : undefined;
      return {
        src: source.src ?? sources.default.src,
        formats: source.formats ??
          confFormats ??
          sources.default.formats ?? [srcFormat ?? defaultSrcFormat],
        aspectRatio: source.aspectRatio ?? sources.default.aspectRatio,
        focalPoint: source.focalPoint ?? sources.default.focalPoint,
        sizes: source.sizes ?? sources.default.sizes,
        widths: source.widths ?? sources.default.widths,
      };
    }) as {
      [M in keyof PictureProps['sources']]: PictureProps['sources'][M] & {
        src: string;
        formats: ImageFormat[];
      };
    },
    fallback: {
      src: sources.default.src,
      format: conf.fallbackFormat?.(defaultSrcFormat) ?? defaultSrcFormat,
      width: max(sources.default.widths),
    },
  };
}

export function getProcessedFilePaths(
  conf: ServerSideConf,
  sources: PictureProps['sources'],
  onlySrc?: string,
) {
  type CreateFileNameArgs = Parameters<CreateFileName>[0];
  const createFileName: CreateFileName = (...args) =>
    conf.serverSideProcessor.processedDir +
    '/' +
    (conf.createFileName ?? defaultCreateFileName)(...args);

  const { sources: normSources, fallback } = normalizeSources(conf, sources);

  return uniq(
    flatMap(
      values(normSources),
      ({ src, formats, aspectRatio, focalPoint, widths }) =>
        flatMap(formats, (format) =>
          (widths ?? [undefined]).map(
            (width) =>
              ({
                src,
                format,
                aspectRatio,
                focalPoint,
                width,
              } as CreateFileNameArgs),
          ),
        ),
    )
      .concat([fallback])
      .filter(({ src }) => onlySrc === undefined || src === onlySrc)
      .map(createFileName),
  );
}

export type PictureElementProps = {
  className?: string;
  sources: JSX.IntrinsicElements['source'][];
  img: JSX.IntrinsicElements['img'];
};

export function toPictureElementProps(
  pictureData: PictureData,
): PictureElementProps {
  const sources = pictureData.sources.map((source) =>
    clean({
      media: source.media !== 'default' ? source.media : undefined,
      srcSet: source.srcset
        .map((src) => {
          const width = src.width !== undefined ? ` ${src.width}w` : '';
          return src.url + width;
        })
        .join(', '),
      sizes: toPairs(source.sizes ?? {})
        .map(([media, size]) => {
          const med = media !== 'default' ? `${media} ` : '';
          const siz = typeof size === 'number' ? `${size}px` : size;
          return med + siz;
        })
        .join(',\n'),
      type: source.mimeType,
    }),
  );

  const img = clean({
    src: pictureData.fallback,
    alt: pictureData.alt,
  });

  return {
    className: pictureData.className,
    sources: sources,
    img: img,
  };
}
