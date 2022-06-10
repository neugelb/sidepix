import { PictureProps, ValueReference } from '../../core';
import ipc from 'node-ipc';
import { launchServerProcess } from './launchServerProcess';
import { IpcServerMessages } from '../server';
import { ipcAppSpace, ipcChannelId } from '../utils';

ipc.config.appspace = ipcAppSpace;

export type IpcClientMessages = {
  processImage: {
    confRef: ValueReference;
    sources: PictureProps['sources'];
  };
  waitImageReady: {
    filePath: string;
  };
  waitQueueEmpty: {};
  quit: {};
};

async function ipcSend<
  ActionT extends keyof IpcClientMessages,
  MessageT extends IpcClientMessages[ActionT],
>(action: ActionT, args: MessageT): Promise<void> {
  await launchServerProcess();
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
        console.log(
          'connected to',
          ipcChannelId,
          ipc.of[ipcChannelId] !== undefined,
        );
        // ipc.of[ipcChannelId].on('connect', () => {
        //   console.log('connect', ipcChannelId);
        //   res();
        // });
        ipc.of[ipcChannelId].on('disconnect', () => {
          ipc.disconnect(ipcChannelId);
        });
        // ipc.of[ipcChannelId].on('destroy', () => {
        //   console.log('destroy', ipcChannelId);
        //   // delete ipc.of[ipcChannelId];
        //   ipc.disconnect(ipcChannelId);
        // });
        // ipc.of[ipcChannelId].on('error', (err) => {
        //   console.log('error', ipcChannelId, err);
        //   // delete ipc.of[ipcChannelId];
        //   ipc.disconnect(ipcChannelId);
        // });

        ipcReceive('imageReady', executeImageReadyCallbacks);
        ipcReceive('queueEmpty', executeQueueEmptyCallbacks);
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

export function executeImageReadyCallbacks(
  args: IpcServerMessages['imageReady'],
): void {
  let i = 0;
  while (i < imageReadyCallbacks.length) {
    const cb = imageReadyCallbacks[i];
    if (cb(args)) {
      imageReadyCallbacks.splice(i, 1);
    } else {
      i++;
    }
  }
}

export function executeQueueEmptyCallbacks() {
  while (queueEmptyCallbacks.length > 0) {
    queueEmptyCallbacks.shift()?.();
  }
}

export function executeQuittingCallbacks() {
  while (quittingCallbacks.length > 0) {
    quittingCallbacks.shift()?.();
  }
}

export async function waitImageReady(filePath: string): Promise<void> {
  await ipcSend('waitImageReady', { filePath });
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
