import keys from 'lodash/keys';
import size from 'lodash/size';
import { ServerSideConf } from '../../core';
import { Writable } from 'stream';
import { fetchCached } from './filesystem';
import { connect } from './streamUtils';

type Queue = {
  isProcessing: boolean;
  streams: Record<string, Writable[]>;
};

export const queue: Queue = {
  isProcessing: false,
  streams: {},
};

export function addToQueue(
  conf: ServerSideConf,
  fileName: string,
  processingStream: Writable,
): void {
  processingStream.setMaxListeners(100);

  if (queue.streams[fileName] === undefined) {
    queue.streams[fileName] = [processingStream];
  } else {
    queue.streams[fileName].push(processingStream);
  }

  if (!queue.isProcessing) {
    void processQueue(conf);
  }
}

async function processQueue(conf: ServerSideConf): Promise<void> {
  while (size(queue.streams) > 0) {
    const fileName = keys(queue.streams)[0];
    queue.isProcessing = true;
    const sourceStream = fetchCached(conf, fileName);
    const processingStreams = queue.streams[fileName].filter((s) => s.writable);
    delete queue.streams[fileName];

    await connect(sourceStream, processingStreams, true);
  }
  queue.isProcessing = false;
}
