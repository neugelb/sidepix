#!/usr/bin/env node

import { quitServer, waitQueueEmpty } from '../processor';

async function main() {
  await waitQueueEmpty();
  await quitServer();
  process.exit(0);
}

main();
