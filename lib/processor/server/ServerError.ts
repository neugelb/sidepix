import { isObjectLike } from '../../core';

// https://tldp.org/LDP/abs/html/exitcodes.html
export enum ServerExitCode {
  Success = 0,
  Generic = 1,
  AlreadyRunning = 2,
  SocketDestroyed = 3,
  SigInt = 130,
  SigTerm = 143,
}

const sidepixServerError = 'SidepixServerError';

export class ServerError extends Error {
  code: number | null;
  name: typeof sidepixServerError;

  constructor(code: number | null) {
    const message = serverErrorMessage(code);
    super(message);
    this.name = sidepixServerError;
    this.code = code;
  }
}

export function isServerError(x: unknown): x is ServerError {
  return isObjectLike(x) && x.name === sidepixServerError;
}

export function serverErrorMessage(error: number | null): string {
  switch (error) {
    case ServerExitCode.AlreadyRunning:
      return 'Image processing server already running';
    case ServerExitCode.SocketDestroyed:
      return 'Socket destroyed';
    case ServerExitCode.SigInt:
      return 'Received SIGINT';
    case ServerExitCode.SigTerm:
      return 'Received SIGTERM';
    default:
      return '';
  }
}
