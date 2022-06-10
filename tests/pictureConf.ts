import { ImageFormat, ServerSideConf } from '../lib/core';
import { resolve } from 'path';
import { createReadStream } from 'fs';
import { PassThrough } from 'stream';

export const pictureConf: ServerSideConf = {
  assetsBaseUrl: 'media',
  targetFormats: () => [ImageFormat.WEBP, ImageFormat.JPEG],
  fallbackFormat: (f) => (f === ImageFormat.GIF ? ImageFormat.JPEG : f),
  serverSideProcessor: {
    originalDir: resolve(__dirname, 'tmp/cache'),
    processedDir: resolve(__dirname, 'tmp/public'),
    fetch: (src: string) =>
      createReadStream(resolve(__dirname, '../../../tests/assets', src)),
  },
  logger: console,
};

function fetchTruncated(src: string) {
  const passthrough = new PassThrough();
  const readStream = createReadStream(
    resolve(__dirname, '../../../test-data', src),
  );
  readStream.on('data', (chunk: Buffer) => {
    passthrough.write(chunk);
    passthrough.destroy(Error('Download error'));
  });
  return passthrough;
}

export const pictureConfTruncate: ServerSideConf = {
  ...pictureConf,
  serverSideProcessor: {
    ...pictureConf.serverSideProcessor,
    fetch: fetchTruncated,
  },
};
