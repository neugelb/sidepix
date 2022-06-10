import {
  ServerSideConf,
  defaultCreateFileName,
  ImageFormat,
  FetchImage,
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
  assetsBaseUrl: 'media',
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
