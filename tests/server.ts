import test from 'tape';
import { launchServerProcess, quitServer } from '../lib/processor';

test("Don't launch server twice", async (t) => {
  await launchServerProcess();
  await launchServerProcess();
  await quitServer();
  t.pass();
});
