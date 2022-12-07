import { FetchImage } from '.';
import { PassThrough } from 'stream';
import { get as httpsGet, RequestOptions } from 'https';
import { get as httpGet } from 'http';

import { connect } from '../processor/server/streamUtils';

export const makeFetchUrl = (options: RequestOptions = {}): FetchImage => {
  return (url) => {
    const stream = new PassThrough();

    const get = url.startsWith('https') ? httpsGet : httpGet;

    get(url, options, (res) => {
      if (res.statusCode !== 200) {
        stream.destroy(
          Error(
            `Error fetching ${url}: ${res.statusCode} - ${res.statusMessage}`,
          ),
        );
      } else {
        connect(res, stream);
      }
    });

    return stream;
  };
};

export const fetchUrl = makeFetchUrl();
