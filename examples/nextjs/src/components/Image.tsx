import NextImage, { ImageProps, ImageLoader } from 'next/image';
import { FunctionComponent } from 'react';
import { ImageFormat, makeGetPictureData } from 'sidepix';
import { createFileName, imageConf } from './PictureConf';
import { resolve } from 'path';

const imageConfRef = {
  filePath: resolve(__dirname, '../../../conf/PictureConf'),
  name: 'imageConf',
};

const getPictureData = makeGetPictureData(imageConf, imageConfRef);

const loader: ImageLoader = ({ src, width }) => {
  getPictureData({ sources: { default: { src, widths: [width] } } });
  return `${imageConf.assetsBaseUrl}/${createFileName({
    src,
    width,
    format: ImageFormat.UNKNOWN,
  })}`;
};

export const Image: FunctionComponent<ImageProps> = (props) => {
  return <NextImage {...props} loader={loader}></NextImage>;
};
