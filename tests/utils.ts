import { FetchImage, ServerSideConf } from '../lib/core';
import { PassThrough, Readable, Transform } from 'stream';
import { FSWatcher } from 'chokidar';
import { promises } from 'fs';
import { resolve } from 'path';

export function randomString(): string {
  return Math.random()
    .toString(36)
    .replace(/[^a-z]+/g, '')
    .substr(0, 10);
}

async function streamString(
  str: string,
  passthrough: PassThrough,
): Promise<void> {
  for (const c of str) {
    await new Promise((r) => setTimeout(r, 100));
    passthrough.write(c);
  }
  passthrough.end();
}

export const fetchString: FetchImage = (src) => {
  const passthrough = new PassThrough();
  streamString(src, passthrough);
  return passthrough;
};

export const fetchStringError: FetchImage = (src) => {
  const fetchStream = fetchString(src);
  let count = 0;
  fetchStream.on('data', () => {
    if (count++ === 1) {
      fetchStream.destroy(Error('Fetch error'));
    }
  });
  return fetchStream;
};

export function upperCase() {
  return new Transform({
    transform(chunk, encoding, callback) {
      this.push(String(chunk).toUpperCase());
      callback();
    },
  });
}

export function spaced() {
  return new Transform({
    transform(chunk, encoding, callback) {
      this.push(String(chunk).split('').join(' '));
      callback();
    },
  });
}

export async function streamToString(stream: Readable): Promise<string> {
  let str = '';
  return new Promise((res) => {
    stream.on('data', (chunk) => (str += String(chunk)));
    stream.on('end', () => res(str));
  });
}

export function readStream(stream: Readable): Promise<string> {
  return new Promise((res) => {
    let str = '';
    stream.on('data', (chunk) => (str += String(chunk)));
    stream.on('close', () => res(str));
  });
}

export function waitAndReadFile(
  watcher: FSWatcher,
  path: string,
): Promise<string> {
  return new Promise(async (res) => {
    const cb = async (newPath: string) => {
      if (newPath === path) {
        watcher.off('add', cb);
        res(String(await promises.readFile(path)));
      }
    };

    watcher.on('add', cb);
  });
}

export const confRef = {
  filePath: resolve(__dirname, 'PictureConf'),
  name: 'pictureConf',
};

export const confRefTruncate = {
  filePath: resolve(__dirname, 'PictureConf'),
  name: 'pictureConfTruncate',
};

export async function recreateWorkingDirs({
  serverSideProcessor: { originalDir, processedDir },
}: ServerSideConf) {
  await promises.rm(originalDir, { recursive: true }).catch(() => {});
  await promises.rm(processedDir, { recursive: true }).catch(() => {});
  await promises.mkdir(originalDir, { recursive: true });
  await promises.mkdir(processedDir, { recursive: true });
}
