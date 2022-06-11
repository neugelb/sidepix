import { spawn } from 'child_process';
import { resolve } from 'path';
import { ServerError, ServerExitCode } from '../server';
import {
  connectToImageProcessor,
  executeQuittingCallbacks,
} from './sendMessages';

let serverPromise: Promise<void> | undefined;

export async function launchServerProcess(
  { detached }: { detached: boolean } = { detached: false },
): Promise<void> {
  if (serverPromise !== undefined) {
    return serverPromise;
  } else {
    serverPromise = new Promise((res, rej) => {
      const onServerReady = () => {
        if (detached) {
          childProcess.unref();
        }
        connectToImageProcessor();
        res();
      };

      const childProcess = spawn(
        'node',
        [resolve(__dirname, '../server/server.js')],
        detached
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
          if (code !== ServerExitCode.AlreadyRunning) {
            console.log('lauchServer unknown error', code);
            rej(new ServerError(code));
          } else {
            onServerReady();
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
