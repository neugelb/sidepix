import { Readable, Writable, Duplex, PassThrough } from 'stream';
import cloneable, { Cloneable, isCloneable } from 'cloneable-readable';
import { isArray } from 'lodash';
import { isObjectLike } from '../../core';

export function zip<T, U>(array1: T[], array2: U[]): [T, U][] {
  const arr = [];
  for (let i = 0; i < Math.min(array1.length, array2.length); i++) {
    arr.push([array1[i], array2[i]] as [T, U]);
  }
  return arr;
}

export function clones<T extends Cloneable<Readable>>(
  stream: T,
  count: number,
): T[] {
  const rest = [...Array<T>(count - 1)].map(() => stream.clone() as T);
  return [stream, ...rest];
}

export async function connect(
  source: Readable | Cloneable<Readable>,
  target: Writable | Writable[],
  debug: boolean = false,
): Promise<void> {
  const cloneableSource = isCloneable(source) ? source : cloneable(source);
  if (source.destroyed) {
    cloneableSource.destroy();
  }

  const targetArray = isArray(target) ? target : [target];
  let healthyTargetsCount = targetArray.length;

  const propagateDownstream = (err: Error) => {
    if (!isUpstreamError(err)) {
      targetArray.forEach((sink) => {
        sink.emit('error', toDownstreamError(err));
      });
    }
  };
  const propagateUpstream = (err: Error) => {
    if (!isDownstreamError(err)) {
      if (--healthyTargetsCount === 0) {
        source.emit('error', toUpstreamError(err));
      }
    }
  };

  source.on('error', propagateDownstream);

  targetArray.forEach((sink) => {
    if (source.destroyed) {
      sink.destroy();
    }
    if (sink.destroyed && --healthyTargetsCount === 0) {
      source.destroy();
    }
    sink.on('error', propagateUpstream);
  });

  if (!source.destroyed) {
    const sources = clones(cloneableSource, targetArray.length);

    await Promise.all(
      zip(sources, targetArray).map(([src, sink], i, arr) => {
        return new Promise<void>((res) => {
          src.on('error', () => {});
          src.pipe(sink);
          sink.on('finish', res);
        });
      }),
    );
    cloneableSource.emit('close');
  }
}

export function makeDestroyedStream(error: Error): Duplex {
  const stream = new PassThrough();
  // delay to give a change to catch error
  setTimeout(() => stream.destroy(error), 0);
  return stream;
}

export function lazyWriteStream(createStream: () => Writable): Writable {
  const passThrough = new PassThrough();

  function onReadable() {
    try {
      const writeStream = createStream();
      connect(passThrough, writeStream);
      passThrough.off('readable', onReadable);
    } catch (err) {
      passThrough.emit('error', err);
    }
  }

  passThrough.on('readable', onReadable);

  passThrough.on('error', () => {});

  return passThrough;
}

const downstream = 'downstream';
export type DownstreamError = Error & { direction: typeof downstream };
export function isDownstreamError(x: unknown): x is DownstreamError {
  return isObjectLike(x) && x.direction === downstream;
}
export function toDownstreamError(error: Error): DownstreamError {
  return {
    ...error,
    direction: downstream,
  };
}

const upstream = 'upstream';
export type UpstreamError = Error & { direction: typeof upstream };
export function isUpstreamError(x: unknown): x is UpstreamError {
  return isObjectLike(x) && x.direction === upstream;
}
export function toUpstreamError(error: Error): UpstreamError {
  return {
    ...error,
    direction: upstream,
  };
}
