import { join } from 'path';
import { ServerSideConf } from '../../core';
import { Readable, Writable, PassThrough } from 'stream';
import { createReadStream, createWriteStream, promises } from 'fs';
import cloneable, { Cloneable } from 'cloneable-readable';
import { connect, lazyWriteStream, makeDestroyedStream } from './streamUtils';
import {
  imageRemoved,
  isImageStatusConflictError,
  processingImageCompleted,
  processingImageStarted,
  waitUntilReady,
} from './registry';
import { ipcChannelId } from '../utils';

export const tempFileSuffix = `.${ipcChannelId}.temp`;

function createReadStreamAsync(
  path: string,
  options?: Parameters<typeof createReadStream>[1],
): Promise<Readable> {
  return new Promise((res) => {
    try {
      const stream = createReadStream(path, options);
      stream.on('open', () => res(stream));
      stream.on('error', () => res(stream));
    } catch (err) {
      res(makeDestroyedStream(err as Error));
    }
  });
}

async function directWriteUnsafe(
  conf: ServerSideConf,
  dir: string,
  fileName: string,
): Promise<Writable> {
  const finalPath = join(dir, fileName);

  await processingImageStarted(finalPath);
  const tempFilePath = finalPath + tempFileSuffix;
  return lazyWriteStream(() =>
    createWriteStream(tempFilePath, { flags: 'wx' })
      .on('error', (err) => {
        void promises.rm(tempFilePath).catch(() => {});
        imageRemoved(finalPath);
        conf.logger?.error(`Error writing temp ${finalPath}: ${String(err)}`);
      })
      .on('finish', async () => {
        await promises.rename(tempFilePath, finalPath);
        conf.logger?.info(`${finalPath} ready`);
        await processingImageCompleted(finalPath);
      }),
  );
}

export async function directWrite(
  conf: ServerSideConf,
  dir: string,
  fileName: string,
): Promise<Writable> {
  try {
    return await directWriteUnsafe(conf, dir, fileName);
  } catch (err) {
    return makeDestroyedStream(err as Error);
  }
}

async function fetchCachedAsync(
  conf: ServerSideConf,
  fileName: string,
): Promise<Readable> {
  const originalDir = conf.serverSideProcessor.originalDir;
  const path = join(originalDir, fileName);
  const fetch = conf.serverSideProcessor.fetch;

  try {
    const writeStream = await directWriteUnsafe(conf, originalDir, fileName);
    const fetchStream = cloneable(fetch(fileName));
    const clonedFetchStream = fetchStream.clone();
    connect(clonedFetchStream, writeStream);
    return fetchStream;
  } catch (err) {
    if (isImageStatusConflictError(err)) {
      switch (err.actualStatus) {
        case 'ready':
          return await createReadStreamAsync(path);
        case 'processing':
          const finalPath = join(originalDir, fileName);
          await waitUntilReady(finalPath);
          return await createReadStreamAsync(path);
      }
    }
    throw err;
  }
}

export function fetchCached(
  conf: ServerSideConf,
  fileName: string,
): Cloneable<Readable> {
  const passthrough = cloneable(new PassThrough());
  passthrough.setMaxListeners(100);

  void fetchCachedAsync(conf, fileName).then((readStream) => {
    connect(readStream, passthrough);
  });

  passthrough.on('error', () => {});

  return passthrough;
}
