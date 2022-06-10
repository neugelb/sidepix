import { ServerSideConf, ImageFormat } from '../lib/core';
import { fetchString, fetchStringError } from './utils';
import { spy } from 'sinon';

const spyFetch = spy(fetchString);

type SpyServerSideConf = Omit<ServerSideConf, 'serverSideProcessor'> & {
  serverSideProcessor: Omit<ServerSideConf['serverSideProcessor'], 'fetch'> & {
    fetch: typeof spyFetch;
  };
};

export const pictureConfString: SpyServerSideConf = {
  assetsBaseUrl: 'media',
  serverSideProcessor: {
    fetch: spyFetch,
    originalDir: `${__dirname}/tmp/cache`,
    processedDir: `${__dirname}/tmp/public`,
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

export const pictureConfStringError: ServerSideConf = {
  ...pictureConfString,
  serverSideProcessor: {
    ...pictureConfString.serverSideProcessor,
    fetch: fetchStringError,
  },
};
