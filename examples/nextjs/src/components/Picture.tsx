import { makePicture } from 'sidepix/react';
import { pictureConf } from './PictureConf';

const pictureConfRef = {
  filePath:
    typeof window === 'undefined'
      ? require('path').resolve(__dirname, '../../../conf/PictureConf')
      : '',
  name: 'pictureConf',
};

export const Picture = makePicture(pictureConf, pictureConfRef);
