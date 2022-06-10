import { resolve } from 'path';
import { makePicture } from 'sidepix/react';
import { pictureConf } from './PictureConf';

const pictureConfRef = {
  filePath: resolve(__dirname, '../../../conf/PictureConf'),
  name: 'pictureConf',
};

export const Picture = makePicture(pictureConf, pictureConfRef);
