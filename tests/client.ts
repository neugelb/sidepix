import test from 'tape';
import { confRef, recreateWorkingDirs } from './utils';
import {
  ipcAppSpace,
  ipcChannelId,
  processImage,
  quitServer,
} from '../lib/processor';
import { PictureProps } from '../lib/core';
import { pictureConf } from './pictureConf';
import ipc from 'node-ipc';
import { join } from 'path';
import { promises } from 'fs';
import { watch } from 'chokidar';

export const pictureProps: PictureProps = {
  sources: {
    '(min-width: 840px)': {
      aspectRatio: 2,
      widths: [800, 1200],
      sizes: {
        '(min-width: 1240px)': '1200px',
        default: '800px',
      },
    },
    '(min-width: 640px)': {
      widths: [600],
      aspectRatio: 2 / 3,
      sizes: {
        default: '600px',
      },
    },
    default: {
      src: 'pexels-carlos-spitzer-17811.jpg',
      aspectRatio: 1,
      focalPoint: [0.46, 0.14],
      widths: [400],
      sizes: {
        default: '400px',
      },
    },
  },
};

test('Requesting image processing starts server', async (t) => {
  await recreateWorkingDirs(pictureConf);

  const socketFile = join(ipc.config.socketRoot, ipcAppSpace + ipcChannelId);

  try {
    await promises.stat(socketFile);
    t.fail();
  } catch {}

  await processImage(confRef, pictureProps);

  await new Promise<void>((res) => {
    const watcher = watch(ipc.config.socketRoot);
    watcher.on('add', async (path) => {
      if (path === socketFile) {
        watcher.close();
        res();
      }
    });
  });

  await quitServer();
  t.pass();
});

test('Requesting image processing starts server (again)', async (t) => {
  await recreateWorkingDirs(pictureConf);

  const socketFile = join(ipc.config.socketRoot, ipcAppSpace + ipcChannelId);

  try {
    await promises.stat(socketFile);
    t.fail();
  } catch {}

  await processImage(confRef, pictureProps);

  await new Promise<void>((res) => {
    const watcher = watch(ipc.config.socketRoot);
    watcher.on('add', async (path) => {
      if (path === socketFile) {
        watcher.close();
        res();
      }
    });
  });

  await quitServer();
  t.pass();
});
