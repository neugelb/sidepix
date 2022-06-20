import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { waitImage } from 'sidepix';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url ?? '', true);
      const { pathname, query } = parsedUrl;

      console.log('pathname:', pathname);

      if (pathname?.startsWith('/media/')) {
        await waitImage('public' + pathname);
      }

      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
