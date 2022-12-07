import { PictureProps, ValueReference } from '../../core';
import ipc from 'node-ipc';
import { launchServerProcess } from './launchServerProcess';
import { IpcServerMessages, WaitImageOptions } from '../server';
import {
  executeCallbacks,
  executeConditionalCallbacks,
  ipcAppSpace,
  ipcChannelId,
} from '../utils';

ipc.config.appspace = ipcAppSpace;

export type IpcClientMessages = {
  processImage: {
    confRef: ValueReference;
    sources: PictureProps['sources'];
  };
  waitImage: {
    filePath: string;
    options?: WaitImageOptions;
  };
  waitQueueEmpty: {};
  quit: {};
};

async function ipcSend<
  ActionT extends keyof IpcClientMessages,
  MessageT extends IpcClientMessages[ActionT],
>(action: ActionT, args: MessageT): Promise<void> {
  await launchServerProcess({ detached: true });
  ipc.of[ipcChannelId].emit(action, args);
}

function ipcReceive<
  ActionT extends keyof IpcServerMessages,
  MessageT extends IpcServerMessages[ActionT],
>(action: ActionT, cb: (msg: MessageT) => void): void {
  ipc.of[ipcChannelId].on(action, cb);
}

ipc.config.silent = true;

export function connectToImageProcessor(): Promise<void> {
  if (ipc.of[ipcChannelId] === undefined) {
    return new Promise((res, rej) => {
      ipc.connectTo(ipcChannelId, () => {
        ipc.of[ipcChannelId].on('connect', res);

        console.log('sidepix - connected to', ipcChannelId);

        ipc.of[ipcChannelId].on('disconnect', () => {
          ipc.disconnect(ipcChannelId);
        });

        ipcReceive('imageReady', (args) =>
          executeConditionalCallbacks(imageReadyCallbacks, args),
        );

        ipcReceive('queueEmpty', () => executeCallbacks(queueEmptyCallbacks));

        ipcReceive('criticalError', ({ message }) =>
          console.error(`sidepix critical error: ${message}`),
        );
      });
    });
  } else {
    return Promise.resolve();
  }
}

export async function processImage(
  confRef: ValueReference,
  { sources }: PictureProps,
): Promise<void> {
  await ipcSend('processImage', { confRef, sources });
}

const imageReadyCallbacks: ((
  args: IpcServerMessages['imageReady'],
) => boolean)[] = [];

const queueEmptyCallbacks: (() => void)[] = [];

const quittingCallbacks: (() => void)[] = [];

export function executeQuittingCallbacks() {
  executeCallbacks(quittingCallbacks);
}

export async function waitImage(
  filePath: string,
  options?: WaitImageOptions,
): Promise<void> {
  await ipcSend('waitImage', { filePath, options });
  return new Promise((res, rej) =>
    imageReadyCallbacks.push((msg) => {
      if (msg.filePath === filePath) {
        if (msg.status === 'ready') {
          res();
          return true;
        } else {
          rej();
        }
      }
      return false;
    }),
  );
}

export async function waitQueueEmpty(): Promise<void> {
  await ipcSend('waitQueueEmpty', {});
  return new Promise((res) => queueEmptyCallbacks.push(res));
}

export async function quitServer(): Promise<void> {
  await ipcSend('quit', {});
  return new Promise((res) => {
    quittingCallbacks.push(res);
  });
}
