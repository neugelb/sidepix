import ipc from 'node-ipc';
import { ImageStatus } from './registry';

export type IpcServerMessages = {
  imageReady: {
    filePath: string;
    status: ImageStatus;
  };
  queueEmpty: {};
  criticalError: {
    message: string;
  };
};

export type Socket = Parameters<typeof ipc.server.emit>[0];

function ipcSend<
  ActionT extends keyof IpcServerMessages,
  MessageT extends IpcServerMessages[ActionT],
>(socket: Socket, action: ActionT, args: MessageT): void {
  ipc.server.emit(socket, action, args);
}

export function imageStatusUpdate(
  socket: Socket,
  filePath: string,
  status: ImageStatus,
) {
  ipcSend(socket, 'imageReady', { filePath, status });
}

export function queueEmpty(socket: Socket) {
  ipcSend(socket, 'queueEmpty', {});
}

export function criticalError(socket: Socket, error: Error) {
  ipcSend(socket, 'criticalError', { message: error.message });
}
