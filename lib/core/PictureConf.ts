import type { Readable } from 'stream';
import Fraction from 'fraction.js';
import type { AvifOptions, JpegOptions, PngOptions, WebpOptions } from 'sharp';
import { formatToExtension, ImageFormat } from './ImageFormat';

export type Logger = {
  trace: (...data: any[]) => void;
  debug: (...data: any[]) => void;
  info: (...data: any[]) => void;
  warn: (...data: any[]) => void;
  error: (...data: any[]) => void;
};

export type CommonConf = {
  assetsBaseUrl: string;
  createFileName?: CreateFileName;
  targetFormats?: (format: ImageFormat) => ImageFormat[];
  fallbackFormat?: (format: ImageFormat) => ImageFormat;
  logger?: Logger;
};

export type FetchImage = (src: string) => Readable;

export type ServerSideConf = CommonConf & {
  serverSideProcessor: {
    originalDir: string;
    processedDir: string;
    fetch: FetchImage;
    options?: {
      [ImageFormat.JPEG]?: JpegOptions;
      [ImageFormat.PNG]?: PngOptions;
      [ImageFormat.AVIF]?: AvifOptions;
      [ImageFormat.WEBP]?: WebpOptions;
      [ImageFormat.SVG]?: undefined;
      [ImageFormat.GIF]?: undefined;
      [ImageFormat.UNKNOWN]?: undefined;
    };
  };
};

export type PictureConf = ServerSideConf | CommonConf;

export type ValueReference = {
  filePath: string;
  name?: string;
};

export type CreateFileName = (args: {
  src: string;
  format: ImageFormat;
  aspectRatio?: number;
  focalPoint?: [number, number];
  width?: number;
}) => string;

export function numberToAspectRatioString(r: number): string {
  return new Fraction(r).toFraction().replace('/', 'by');
}

export const defaultCreateFileName: CreateFileName = ({
  src,
  format,
  aspectRatio,
  focalPoint,
  width,
}): string => {
  let fileName = `${src}`;

  if (focalPoint) {
    const x = String(Math.round(100 * focalPoint[0]));
    const y = String(Math.round(100 * focalPoint[1]));
    fileName += `_${x}-${y}`;
  }

  if (aspectRatio) {
    fileName += `_${numberToAspectRatioString(aspectRatio)}`;
  }

  if (width) {
    fileName += `_${width}`;
  }

  return fileName + `${formatToExtension(format)}`;
};

export function isServersideConf(conf: PictureConf): conf is ServerSideConf {
  return conf['serverSideProcessor'] !== undefined;
}
