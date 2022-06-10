import test from 'tape';
import { basename } from 'path';
import { directWrite, fetchCached, tempFileSuffix } from '../lib/processor';
import { promises } from 'fs';
import { FSWatcher, watch } from 'chokidar';
import { randomString } from './utils';
import { pictureConfString, pictureConfStringError } from './pictureConfString';
import { Writable } from 'stream';
import { isImageStatusConflictError } from '../lib/processor/server/registry';

const { originalDir, processedDir } = pictureConfString.serverSideProcessor;

let watcher: FSWatcher;
// const endTest = Error('End test');

function watchOnce(event: 'add' | 'unlink', listener: (path: string) => void) {
  watcher.on(event, (path) => {
    listener(path);
    watcher.off(event, listener);
  });
}

test('Setup file watcher', async (t) => {
  await promises.mkdir(originalDir, { recursive: true }).catch(() => {});
  await promises.mkdir(processedDir, { recursive: true }).catch(() => {});
  watcher = watch([originalDir, processedDir]);
  await new Promise((r) => watcher.on('ready', r));
  t.pass();
});

test("Don't open file for writing if no data is provided", async (t) => {
  const fileName = randomString();

  const writeStream = await directWrite(
    pictureConfString,
    originalDir,
    fileName,
  );

  watchOnce('add', async (path) => {
    if (basename(path) === fileName + tempFileSuffix) {
      t.fail();
    }
  });

  await new Promise((r) => setTimeout(r, 1000));
  writeStream.end();
  t.pass();
});

test('Open file for writing when data is provided', async (t) => {
  const fileName = randomString();

  const writeStream = await directWrite(
    pictureConfString,
    originalDir,
    fileName,
  );

  watchOnce('add', async (path) => {
    if (basename(path) === fileName + tempFileSuffix) {
      t.pass();
    }
  });

  writeStream.emit('x');
  writeStream.emit('close');
});

test('Destroy stream if file exists', async (t) => {
  t.plan(1);
  const fileName = randomString();

  const writeStream1 = await directWrite(
    pictureConfString,
    originalDir,
    fileName,
  );

  const writeStream2 = await new Promise<Writable>(async (resolve) => {
    const writeStream = await directWrite(
      pictureConfString,
      originalDir,
      fileName,
    );
    writeStream.on('error', (err) => {
      if (
        isImageStatusConflictError(err) &&
        err.actualStatus === 'processing'
      ) {
        resolve(writeStream);
      }
    });
  });

  t.ok(writeStream2.destroyed);

  writeStream1.end();
});

test('Destroy stream if file exists (simultaneous)', async (t) => {
  t.plan(1);

  const fileName = randomString();

  const [writeStream1, writeStream2] = await new Promise<[Writable, Writable]>(
    (resolve) => {
      let s1: Writable;
      let s2: Writable;
      directWrite(pictureConfString, originalDir, fileName).then((s) => {
        s1 = s;
        if (s2 !== undefined) {
          resolve([s1, s2]);
        }
      });
      directWrite(pictureConfString, originalDir, fileName).then((s) => {
        s2 = s;
        if (s1 !== undefined) {
          resolve([s1, s2]);
        }
      });
    },
  );

  await new Promise((resolve) => {
    writeStream1.on('error', resolve);
    writeStream2.on('error', resolve);
  });

  t.notEqual(writeStream1.destroyed, writeStream2.destroyed);
});

test('Cache miss', async (t) => {
  t.plan(1);

  const fileName = randomString();
  const readStream = fetchCached(pictureConfString, fileName);

  let streamedData = '';
  readStream.on('data', (chunk) => (streamedData += chunk));

  await new Promise((r) => readStream.on('end', r));

  t.equal(streamedData, fileName);
});

test('Cache hit (complete file)', async (t) => {
  t.plan(2);

  const fileName = randomString();

  pictureConfString.serverSideProcessor.fetch.resetHistory();

  const readStream1 = fetchCached(pictureConfString, fileName);
  readStream1.on('data', () => {});
  await new Promise((r) => readStream1.on('end', r));

  const readStream2 = fetchCached(pictureConfString, fileName);
  let data = '';
  readStream2.on('data', (chunk) => (data += chunk));
  await new Promise((r) => readStream2.on('end', r));

  t.equal(pictureConfString.serverSideProcessor.fetch.callCount, 1);
  t.equal(data, fileName);
});

test('Cache hit (incomplete file)', async (t) => {
  t.plan(2);

  const fileName = randomString();

  pictureConfString.serverSideProcessor.fetch.resetHistory();

  const readStream1 = fetchCached(pictureConfString, fileName);
  readStream1.on('data', () => {});

  const readStream2 = fetchCached(pictureConfString, fileName);
  let data = '';
  readStream2.on('data', (chunk) => (data += chunk));
  await new Promise((r) => readStream2.on('end', r));

  t.equal(pictureConfString.serverSideProcessor.fetch.callCount, 1);
  t.equal(data, fileName);
});

test('Delete temporary files on error', async (t) => {
  t.plan(1);

  const fileName = randomString();

  fetchCached(pictureConfStringError, fileName);

  await new Promise<void>(async (resolve) => {
    watchOnce('unlink', async (path) => {
      if (basename(path) === fileName + tempFileSuffix) {
        resolve();
      }
    });
  });

  t.equal(fileName, fileName);
});

test('Tear down file watcher', async (t) => {
  await watcher.close();
  await promises.rm(processedDir, { recursive: true });
  t.pass();
});
