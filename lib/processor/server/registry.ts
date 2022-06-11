import { promises } from 'fs';
import { isObjectLike } from '../../core';
import { dirname } from 'path';
import values from 'lodash/values';
import { executeCallbacks, executeConditionalCallbacks } from '../utils';

export type ImageStatus = 'processing' | 'ready' | 'absent';

type ImageRecord = {
  status: ImageStatus;
  readyCallbacks: ((x: void | PromiseLike<void>) => void)[];
  removedCallbacks: ((x: void | PromiseLike<void>) => void)[];
};

type ImageRegistry = Record<string, ImageRecord>;

const registry: ImageRegistry = {};
const directories: string[] = [];

const imageStatusConflictError = 'imageStatusConflictError';
export class ImageStatusConflictError extends Error {
  actualStatus: ImageStatus;
  name: typeof imageStatusConflictError;

  constructor(actualStatus: ImageStatus) {
    super(`Actual status: ${actualStatus}`);
    this.name = imageStatusConflictError;
    this.actualStatus = actualStatus;
  }
}

export function isImageStatusConflictError(
  x: unknown,
): x is ImageStatusConflictError {
  return isObjectLike(x) && x.name === imageStatusConflictError;
}

async function prefillRegistry(directory: string): Promise<void> {
  if (!directories.includes[directory]) {
    directories.push(directory);
    const files = await promises.readdir(directory);
    const readyFiles = files.filter((file) => !file.endsWith('.temp'));
    readyFiles.forEach(
      (file) =>
        (registry[file] = {
          status: 'ready',
          readyCallbacks: [],
          removedCallbacks: [],
        }),
    );
  }
}

function createImageRecord(status: ImageStatus): ImageRecord {
  return {
    status,
    readyCallbacks: [],
    removedCallbacks: [],
  };
}

export async function processingImageStarted(imagePath: string) {
  await prefillRegistry(dirname(imagePath));

  const record = registry[imagePath];

  if (record === undefined) {
    registry[imagePath] = createImageRecord('processing');
  } else {
    if (record.status === 'absent') {
      record.status = 'processing';
    } else {
      throw new ImageStatusConflictError(registry[imagePath].status);
    }
  }

  executeConditionalCallbacks(updatedCallbacks, undefined);
}

export async function processingImageCompleted(imagePath: string) {
  const record = registry[imagePath];
  if (record === undefined) {
    throw new ImageStatusConflictError('absent');
  }
  if (record.status !== 'processing') {
    throw new ImageStatusConflictError(record.status);
  }
  record.readyCallbacks.forEach((cb) => cb());
  record.readyCallbacks = [];
  record.status = 'ready';

  executeConditionalCallbacks(updatedCallbacks, undefined);
}

export async function imageRemoved(imagePath: string) {
  const callbacks = registry[imagePath]?.removedCallbacks ?? [];
  executeCallbacks(callbacks);
  delete registry[imagePath];

  executeConditionalCallbacks(updatedCallbacks, undefined);
}

export async function waitUntilReady(imagePath: string): Promise<void> {
  return new Promise(async (res, rej) => {
    if (registry[imagePath]?.status === 'ready') {
      res();
    } else {
      if (registry[imagePath] === undefined) {
        registry[imagePath] = createImageRecord('absent');
      }
      registry[imagePath].readyCallbacks.push(() => {
        res();
      });
      registry[imagePath].removedCallbacks.push(() => {
        rej();
      });
    }
  });
}

const updatedCallbacks: (() => boolean)[] = [];

function allReady(): boolean {
  return values(registry).every(({ status }) => status === 'ready');
}

export function waitUntilAllReady(): Promise<void> {
  if (allReady()) {
    return Promise.resolve();
  } else {
    return new Promise((res) =>
      updatedCallbacks.push(() => {
        if (allReady()) {
          res();
          return true;
        } else {
          return false;
        }
      }),
    );
  }
}
