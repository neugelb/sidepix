import { spawn } from 'child_process';
import { resolve } from 'path';
import { ServerError, ServerExitCode } from '../server';
import { connectToImageProcessor } from './sendMessages';
import { executeQuittingCallbacks } from './sendMessages';

let serverPromise: Promise<void> | undefined;

export async function launchServerProcess(): Promise<void> {
  if (serverPromise !== undefined) {
    return serverPromise;
  } else {
    serverPromise = new Promise((res, rej) => {
      const onServerReady = () => {
        childProcess.unref();
        connectToImageProcessor();
        res();
      };

      const childProcess = spawn(
        'node',
        [resolve(__dirname, '../server/server.js')],
        {
          detached: true,
          stdio: 'ignore',
        },
      )
        .on('error', (err) => {
          rej(err);
        })
        .on('exit', async (code, signal) => {
          serverPromise = undefined;
          if (code !== ServerExitCode.AlreadyRunning) {
            rej(new ServerError(code));
          } else {
            onServerReady();
          }
        })
        .on('close', async () => {
          await executeQuittingCallbacks();
        });

      process.on('SIGUSR2', onServerReady);
    });
    return serverPromise;
  }
}
