import ipc from 'node-ipc';
import { Socket } from 'net';
import { IpcClientMessages } from '../client';
import { processImage } from './processImage';
import { ServerSideConf, ValueReference } from '../../core';
import { requireValue } from '../utils';
import { waitUntilReady, waitUntilAllReady } from './registry';
import { imageStatusUpdate, queueEmpty } from './sendMessages';

export function ipcReceiveRequest<
  ActionT extends keyof IpcClientMessages,
  MessageT extends IpcClientMessages[ActionT],
>(action: ActionT, cb: (msg: MessageT, socket: Socket) => void): void {
  ipc.server.on(action, cb);
}

const configs: Record<string, ServerSideConf> = {};

function loadConf(confRef: ValueReference): ServerSideConf {
  const confId = JSON.stringify(confRef);
  const conf = configs[confId];
  if (conf !== undefined) {
    return conf;
  } else {
    configs[confId] = requireValue(confRef);
    return configs[confId];
  }
}

export function ipcHandleRequests() {
  ipcReceiveRequest('processImage', ({ confRef, sources }) => {
    const conf = loadConf(confRef);
    processImage(conf, sources);
  });

  ipcReceiveRequest('waitImageReady', async ({ filePath }, socket) => {
    try {
      await waitUntilReady(filePath);
      imageStatusUpdate(socket, filePath, 'ready');
    } catch {
      imageStatusUpdate(socket, filePath, 'absent');
    }
  });

  ipcReceiveRequest('waitQueueEmpty', async ({}, socket) => {
    await waitUntilAllReady();
    queueEmpty(socket);
  });

  ipcReceiveRequest('quit', () => {
    process.exit(0);
  });
}
