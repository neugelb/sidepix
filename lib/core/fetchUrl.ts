import { FetchImage } from '.';
import { Duplex } from 'stream';
import { get } from 'https';
import { connect } from '../processor/server/streamUtils';

export const fetchUrl: FetchImage = (url) => {
  const stream = new Duplex();

  get(url, (res) => {
    if (res.statusCode !== 200) {
      stream.destroy(
        Error(
          `Error while fetching ${url}: status code ${String(res.statusCode)}`,
        ),
      );
    }
    connect(res, stream);
  }).on('error', (err) => {
    stream.destroy(Error(`Error while fetching ${url}: ${String(err)}`));
  });

  return stream;
};
