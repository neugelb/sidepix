import test from 'tape';
import { join } from 'path';
import { PassThrough } from 'stream';
import {
  readStream,
  spaced,
  upperCase,
  waitAndReadFile,
  randomString,
  recreateWorkingDirs,
} from './utils';
import { watch, FSWatcher } from 'chokidar';
import { addToQueue } from '../lib/processor/server/processingQueue';
import { pictureConfString } from './pictureConfString';

const { originalDir } = pictureConfString.serverSideProcessor;

let watcher: FSWatcher;

async function createAndWatchDirs() {
  watcher?.close();
  await recreateWorkingDirs(pictureConfString);
  watcher = watch(originalDir);
  await new Promise((res) => watcher.on('ready', res));
}

test('Read one source', async (t) => {
  await createAndWatchDirs();

  t.plan(2);

  const src = randomString();

  const passthrough = new PassThrough();
  const streamPromise = readStream(passthrough);

  const filePromise = waitAndReadFile(watcher, join(originalDir, src));

  addToQueue(pictureConfString, src, passthrough);

  const [streamContents, fileContents] = await Promise.all([
    streamPromise,
    filePromise,
  ]);

  t.equal(fileContents, src);
  t.equal(streamContents, fileContents);
});

test('Process one source', async (t) => {
  await createAndWatchDirs();

  t.plan(2);

  const src = randomString();

  const transform = upperCase();
  const streamPromise = readStream(transform);

  const filePromise = waitAndReadFile(watcher, join(originalDir, src));

  addToQueue(pictureConfString, src, transform);

  const [streamContents, fileContents] = await Promise.all([
    streamPromise,
    filePromise,
  ]);

  t.equal(fileContents, src);
  t.equal(streamContents, fileContents.toUpperCase());
});

test('Process one source twice', async (t) => {
  await createAndWatchDirs();

  t.plan(3);

  const src = randomString();

  const transform1 = upperCase();
  const streamPromise1 = readStream(transform1);

  const transform2 = spaced();
  const streamPromise2 = readStream(transform2);

  const filePromise = waitAndReadFile(watcher, join(originalDir, src));

  addToQueue(pictureConfString, src, transform1);
  addToQueue(pictureConfString, src, transform2);

  const [streamContents1, streamContents2, fileContents] = await Promise.all([
    streamPromise1,
    streamPromise2,
    filePromise,
  ]);

  t.equal(fileContents, src);
  t.equal(streamContents1, fileContents.toUpperCase());
  t.equal(streamContents2, fileContents.split('').join(' '));
});

test('Tear down file watcher', async (t) => {
  await watcher.close();
});
