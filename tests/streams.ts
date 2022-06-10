import test from 'tape';
import {
  connect,
  toDownstreamError,
  toUpstreamError,
} from '../lib/processor/server/streamUtils';
import { PassThrough } from 'stream';

test('streamTo: streams data', async (t) => {
  t.plan(1);

  const text = 'asdf';
  let written = '';

  const source = new PassThrough();
  const target = new PassThrough().on('data', (d) => (written += String(d)));

  source.on('resume', () => {
    source.emit('data', text);
    source.emit('end');
  });

  await connect(source, target);

  t.equal(text, written);
});

test('streamTo: from destroyed stream', async (t) => {
  t.plan(1);

  const source = new PassThrough();
  const target = new PassThrough();
  source.destroy();

  await connect(source, target);

  t.ok(target.destroyed);
});

test('streamTo: to destroyed stream', async (t) => {
  t.plan(1);

  const source = new PassThrough();
  const target = new PassThrough();
  target.destroy();

  await connect(source, target);

  t.ok(source.destroyed);
});

test('streamTo: propagate error downstream, 1 target', async (t) => {
  t.plan(1);

  const error = Error('test');

  const source = new PassThrough();
  const target = new PassThrough();

  source.on('resume', () => source.emit('error', error));
  target.on('error', (err) => {
    t.deepEqual(err, toDownstreamError(error));
  });

  await connect(source, target);
});

test('streamTo: propagate error upstream, 1 target', async (t) => {
  t.plan(1);

  const error = Error('test');

  const source = new PassThrough();
  const target = new PassThrough();

  source.on('resume', () => target.emit('error', error));
  source.on('error', (err) => t.deepEqual(err, toUpstreamError(error)));

  await connect(source, target);
});

test('streamTo: propagate error downstream, n targets', async (t) => {
  t.plan(2);

  const error = Error('test');

  const source = new PassThrough();
  const target1 = new PassThrough();
  const target2 = new PassThrough();

  source.on('resume', () => source.emit('error', error));
  target1.on('error', (err) => t.deepEqual(err, toDownstreamError(error)));
  target2.on('error', (err) => t.deepEqual(err, toDownstreamError(error)));

  await connect(source, [target1, target2]);
});

test('streamTo: propagate error upstream, n targets', async (t) => {
  t.plan(2);

  const text = 'asdf';
  const error = Error('test');

  const source = new PassThrough();
  const target1 = new PassThrough();
  const target2 = new PassThrough();

  source.on('resume', () => {
    target1.emit('error', error);
    source.emit('data', text);
  });
  target2.on('data', (d) => {
    t.equal(String(d), text);
    target2.emit('error', error);
  });
  source.on('error', (err) => t.deepEqual(err, toUpstreamError(error)));

  await connect(source, [target1, target2]);
});
