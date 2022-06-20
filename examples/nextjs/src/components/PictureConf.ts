import {
  ServerSideConf,
  ImageFormat,
  FetchImage,
  CreateFileName,
  formatToExtension,
  extensionToFormat,
} from 'sidepix';

const fetch: FetchImage =
  typeof window === 'undefined'
    ? (src) => {
        const { createReadStream } = require('fs');
        return createReadStream(`../../tests/assets/${src}`);
      }
    : () => {};

/*
If you need to fetch images from a remote server you can use fetchUrl:

const fetch: FetchImage =
  typeof window === 'undefined'
    ? (src) => fetchUrl(`https://your-cms/your-account/media/${src}`)
    : () => {};
*/

export const pictureConf: ServerSideConf = {
  assetsBaseUrl: '/media',
  serverSideProcessor: {
    fetch,
    originalDir: 'image-cache',
    processedDir: 'public/media',
  },
  targetFormats: (format) => {
    switch (format) {
      case ImageFormat.JPEG:
        return [ImageFormat.WEBP, ImageFormat.JPEG];
      case ImageFormat.PNG:
        return [ImageFormat.WEBP, ImageFormat.PNG];
      case ImageFormat.GIF:
        return [ImageFormat.WEBP];
      default:
        return [format];
    }
  },
  fallbackFormat: (format) => {
    switch (format) {
      case ImageFormat.GIF:
        return ImageFormat.JPEG;
      default:
        return format;
    }
  },
  logger: console,
};

export const createFileName: CreateFileName = ({ src, width }) => {
  const [base, ext] = src.split('.');
  const extension = formatToExtension(extensionToFormat(`.${ext}`));
  return base + (width !== undefined ? '_' + width : '') + extension;
};

export const imageConf: ServerSideConf = {
  assetsBaseUrl: '/media',
  createFileName,
  serverSideProcessor: {
    fetch,
    originalDir: 'image-cache',
    processedDir: 'public/media',
  },
  logger: console,
};
