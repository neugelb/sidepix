import { spawn } from 'child_process';
import { resolve } from 'path';
import { ServerError, serverErrorMessage, ServerExitCode } from '../server';
import { ipcAppSpace, ipcChannelId, ipcSocketRoot } from '../utils';
import {
  connectToImageProcessor,
  executeQuittingCallbacks,
} from './sendMessages';

let serverPromise: Promise<void> | undefined;

export async function launchServerProcess(
  options: { detached: boolean } = { detached: false },
): Promise<void> {
  if (serverPromise !== undefined) {
    return serverPromise;
  } else {
    serverPromise = new Promise((res, rej) => {
      const onServerReady = () => {
        if (options.detached) {
          childProcess.unref();
        }
        connectToImageProcessor();
        res();
      };

      const childProcess = spawn(
        'node',
        [resolve(__dirname, '../server/server.js')],
        options.detached
          ? {
              detached: true,
              stdio: 'ignore',
            }
          : {},
      )
        .on('error', (err) => {
          rej(err);
        })
        .on('exit', async (code, signal) => {
          serverPromise = undefined;
          if (code === ServerExitCode.AlreadyRunning && options.detached) {
            onServerReady();
          } else if (code !== ServerExitCode.Success) {
            if (code === ServerExitCode.AlreadyRunning) {
              const socketFile = ipcSocketRoot + ipcAppSpace + ipcChannelId;
              console.error(
                `There seems to be another image processing server running. You may want to delete the socket file ${socketFile}`,
              );
            } else {
              console.error(
                `launchServer unexpected error ${code}: ${serverErrorMessage(
                  code,
                )}`,
              );
            }
            rej(new ServerError(code));
          }
        })
        .on('close', async () => {
          await executeQuittingCallbacks();
        });

      process.on('SIGUSR2', onServerReady);

      childProcess.stdout?.on('data', (d) => console.log(String(d)));
      childProcess.stderr?.on('data', (d) => console.log(String(d)));
    });
    return serverPromise;
  }
}
