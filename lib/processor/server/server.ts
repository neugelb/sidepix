import ipc from 'node-ipc';
import { stat } from 'fs';
import { ServerExitCode } from './ServerError';
import { ipcHandleRequests } from './handleRequests';
import { ipcAppSpace, ipcChannelId, ipcSocketRoot } from '../utils';
import { appendFileSync } from 'fs';

ipc.config.socketRoot = ipcSocketRoot;
ipc.config.appspace = ipcAppSpace;
ipc.config.id = ipcChannelId;
ipc.config.retry = 1500;
ipc.config.unlink = false;

const socketFile = ipc.config.socketRoot + ipc.config.appspace + ipc.config.id;

stat(socketFile, function (err) {
  if (err === null) {
    process.exit(ServerExitCode.AlreadyRunning);
  } else if (err.code === 'ENOENT') {
    ipc.serve(ipcHandleRequests);

    ipc.server.on('destroy', () => {
      console.log('ipc.serve.on destroy');
      process.exit(ServerExitCode.SocketDestroyed);
    });
    ipc.server.on('error', (err) => {
      console.log('ipc.serve.on error', err);
      if (err.code === 'EADDRINUSE' || err.code === 'EEXIST') {
        process.exit(ServerExitCode.AlreadyRunning);
      } else {
        appendFileSync(
          '/tmp/sidepix-log',
          'unknown error A ' + JSON.stringify(err) + '\n',
        );
        process.exit(ServerExitCode.Generic);
      }
    });

    ipc.server.start();

    ipc.server.on('start', () => {
      process.kill(process.ppid, 'SIGUSR2');
    });
  } else {
    appendFileSync(
      '/tmp/sidepix-log',
      'unknown error B ' + JSON.stringify(err) + '\n',
    );
    process.exit(ServerExitCode.Generic);
  }
});

process.on('exit', (exitCode: ServerExitCode) => {
  console.log('server process exit', exitCode);
  if (exitCode !== ServerExitCode.AlreadyRunning && ipc.server) {
    ipc.server.stop();
  }
});
