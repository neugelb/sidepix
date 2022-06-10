import test from 'tape';
import { processImage, quitServer } from '../lib/processor';
import { promises } from 'fs';
import { join } from 'path';
import { getProcessedFilePaths, PictureProps } from '../lib/core';
import { tempFileSuffix } from '../lib/processor';
import _ from 'lodash';
import { confRef, confRefTruncate, recreateWorkingDirs } from './utils';
import { pictureConf } from './pictureConf';
import { waitImageReady } from '../lib/processor/client/sendMessages';

const completeJpeg = 'pexels-carlos-spitzer-17811.jpg';
const truncatedJpeg = 'pexels-carlos-spitzer-17811-TRUNCATED.jpg';

const { processedDir } = pictureConf.serverSideProcessor;

test('Process image', async (t) => {
  await recreateWorkingDirs(pictureConf);

  t.plan(1);
  const focalPoint: [number, number] = [0.3, 0.2];

  const sources: PictureProps['sources'] = {
    '(min-width: 800px)': {
      aspectRatio: 16 / 9,
      widths: [800, 1200],
    },
    default: {
      src: completeJpeg,
      aspectRatio: 4 / 3,
      focalPoint,
      widths: [300, 600],
      sizes: {
        default: '90vw',
      },
    },
  };

  processImage(confRef, { sources });

  const targetFiles = getProcessedFilePaths(pictureConf, sources);

  await Promise.all(targetFiles.map((file) => waitImageReady(file)));

  const allFiles = (await promises.readdir(processedDir)).map((file) =>
    join(processedDir, file),
  );
  const generatedFiles = _.intersection(targetFiles, allFiles);

  t.equal(generatedFiles.length, targetFiles.length);
});

// This one triggers an uncaught:
// [Error: Input buffer contains unsupported image format]

test('Process cached truncated image', async (t) => {
  await recreateWorkingDirs(pictureConf);

  t.plan(1);
  const focalPoint: [number, number] = [0.3, 0.2];

  const sources: PictureProps['sources'] = {
    '(min-width: 800px)': {
      aspectRatio: 16 / 9,
      widths: [800, 1200],
    },
    default: {
      src: truncatedJpeg,
      aspectRatio: 4 / 3,
      focalPoint,
      widths: [300, 600],
      sizes: {
        default: '90vw',
      },
    },
  };

  processImage(confRef, { sources });

  const targetFiles = getProcessedFilePaths(pictureConf, sources);
  const targetTempFiles = targetFiles.map((f) => f + tempFileSuffix);

  await Promise.allSettled(targetFiles.map((f) => waitImageReady(f)));

  const allFiles = (await promises.readdir(processedDir)).map((file) =>
    join(processedDir, file),
  );
  const generatedFiles = _.intersection(targetFiles, allFiles);

  const remainingTempFiles = _.intersection(targetTempFiles, generatedFiles);

  t.equal(remainingTempFiles.length, 0);
});

test('Process image truncated at download', async (t) => {
  await recreateWorkingDirs(pictureConf);

  t.plan(2);
  const focalPoint: [number, number] = [0.3, 0.2];

  const sources: PictureProps['sources'] = {
    '(min-width: 800px)': {
      aspectRatio: 16 / 9,
      widths: [800, 1200],
    },
    default: {
      src: completeJpeg,
      aspectRatio: 4 / 3,
      focalPoint,
      widths: [300, 600],
      sizes: {
        default: '90vw',
      },
    },
  };

  processImage(confRefTruncate, { sources });

  const targetFiles = getProcessedFilePaths(pictureConf, sources);
  const targetTempFiles = targetFiles.map((f) => f + tempFileSuffix);

  await Promise.allSettled(targetFiles.map((file) => waitImageReady(file)));

  const allFiles = (await promises.readdir(processedDir)).map((file) =>
    join(processedDir, file),
  );
  const generatedFiles = _.intersection(targetFiles, allFiles);

  const generatedOriginalFile = _.intersection([completeJpeg], generatedFiles);
  const remainingTempFiles = _.intersection(targetTempFiles, generatedFiles);

  t.equal(generatedOriginalFile.length, 0);
  t.equal(remainingTempFiles.length, 0);
});

test('Process GIF', async (t) => {
  await recreateWorkingDirs(pictureConf);

  t.plan(1);

  const sources: PictureProps['sources'] = {
    default: {
      src: 'Duvor.gif',
    },
  };

  processImage(confRef, { sources });

  const targetFiles = getProcessedFilePaths(pictureConf, sources);

  await Promise.allSettled(targetFiles.map((file) => waitImageReady(file)));

  const allFiles = (await promises.readdir(processedDir)).map((file) =>
    join(processedDir, file),
  );
  const generatedFiles = _.intersection(targetFiles, allFiles);

  t.equal(generatedFiles.length, targetFiles.length);
});

test('Quit server', async (t) => {
  await quitServer();
  t.pass();
});
