import {
  ServerSideConf,
  sharpFormatToImageFormat,
  PictureProps,
  getProcessedFilePaths,
  normalizeSources,
  defaultCreateFileName,
} from '../../core';
import sharp, { Metadata } from 'sharp';
import clamp from 'lodash/clamp';
import { addToQueue } from './processingQueue';
import { directWrite } from './filesystem';
import { clones, connect, isUpstreamError, zip } from './streamUtils';
import values from 'lodash/values';
import groupBy from 'lodash/groupBy';
import pick from 'lodash/pick';
import isEmpty from 'lodash/isEmpty';
import { imageRemoved } from './registry';

function getCropValues(
  originalImageMetadata: Metadata,
  targetRatio: number,
  focalPoint: [number, number] = [0.5, 0.5],
): { left: number; top: number; width: number; height: number } {
  const sourceWidth = originalImageMetadata.width || 0;
  const sourceHeight = originalImageMetadata.height || 0;
  const sourceRatio = sourceWidth / sourceHeight;

  let cropWidth = sourceWidth;
  let cropHeight = sourceHeight;

  let originX = 0;
  let originY = 0;

  if (sourceRatio < targetRatio) {
    cropHeight = Math.floor(cropWidth / targetRatio);
    originY = sourceHeight * focalPoint[1] - cropHeight / 2;
  } else if (sourceRatio > targetRatio) {
    cropWidth = Math.floor(cropHeight * targetRatio);
    originX = sourceWidth * focalPoint[0] - cropWidth / 2;
  }

  const clampWidth = sourceWidth - cropWidth;
  const clampHeight = sourceHeight - cropHeight;

  const cropOrigin = {
    x: clamp(originX, 0, clampWidth),
    y: clamp(originY, 0, clampHeight),
  };

  return {
    left: Math.round(cropOrigin.x),
    top: Math.round(cropOrigin.y),
    width: Math.round(cropWidth),
    height: Math.round(cropHeight),
  };
}

// TODO: split into smaller functions
export async function processImage(
  conf: ServerSideConf,
  sources: PictureProps['sources'],
): Promise<void> {
  const { sources: normalizedSources, fallback } = normalizeSources(
    conf,
    sources,
  );

  const groupedSources = groupBy(
    values(normalizedSources),
    (source) => source.src,
  );

  for (const src in groupedSources) {
    const sharpStream = sharp(); // sharp options maybe configurable?
    sharpStream.on('error', removeImagesFromSource(conf, sources, src));
    addToQueue(conf, src, sharpStream);
    let metadata;
    try {
      metadata = await sharpStream.metadata();
    } catch (err) {
      removeImagesFromSource(conf, sources, src);
      sharpStream.destroy();
      return;
    }

    const originalFormat = sharpFormatToImageFormat(metadata.format);

    const originalWidth = metadata.width ?? 0;
    const originalHeight = metadata.height ?? 0;
    const originalAspectRatio = originalWidth / originalHeight;

    for (const { focalPoint, aspectRatio, widths, formats } of groupedSources[
      src
    ]) {
      const widthsFix = widths ?? [originalWidth];

      let cropped = sharpStream.clone();
      if (aspectRatio !== undefined && aspectRatio !== originalAspectRatio) {
        const cropValues = getCropValues(metadata, aspectRatio, focalPoint);
        cropped = cropped.extract(cropValues);
      }

      const widthStreams = clones(cropped, widthsFix.length);
      for (const [w, s2] of zip(widthsFix, widthStreams)) {
        const shrinked = w === originalWidth ? s2 : s2.resize({ width: w });

        const formatStreams = clones(shrinked, formats.length);
        for (const [f, s3] of zip(formats, formatStreams)) {
          const animationOptions = pick(
            metadata,
            'pageHeight',
            'loop',
            'delay',
          );
          const formatOptions = {
            ...animationOptions,
            ...(conf.serverSideProcessor.options?.[f] ?? {}),
          };
          const converted =
            f === originalFormat && !isEmpty(formatOptions)
              ? s3
              : s3.toFormat(sharp.format[f], formatOptions);

          converted.on('error', (err) => {
            conf.logger?.error(`Error on sharp converted (${src}):`, err);
          });

          const createFileName = conf.createFileName ?? defaultCreateFileName;
          const fileName = createFileName({
            src,
            format: f,
            aspectRatio,
            focalPoint,
            width: w !== originalWidth ? w : undefined,
          });
          const writeStream = await directWrite(
            conf,
            conf.serverSideProcessor.processedDir,
            fileName,
          );
          connect(converted, writeStream);
        }
      }
    }

    if (src === fallback.src) {
      const width = fallback.width;
      const format = fallback.format;

      let converted = sharpStream;
      if (width !== undefined && width !== originalWidth) {
        converted = converted.resize({ width });
      }
      const animationOptions = pick(metadata, 'pageHeight', 'loop', 'delay');
      const formatOptions = {
        ...animationOptions,
        ...(conf.serverSideProcessor.options?.[format] ?? {}),
      };
      if (format !== originalFormat || !isEmpty(formatOptions)) {
        converted = converted.toFormat(sharp.format[format], formatOptions);
      }

      const createFileName = conf.createFileName ?? defaultCreateFileName;
      const fallbackFile = createFileName({
        src,
        format,
        width,
      });

      const writeStream = await directWrite(
        conf,
        conf.serverSideProcessor.processedDir,
        fallbackFile,
      );
      connect(converted, writeStream);
    }
  }
}

function removeImagesFromSource(
  conf: ServerSideConf,
  sources: PictureProps['sources'],
  src: string,
) {
  return (err: any) => {
    if (!isUpstreamError(err)) {
      getProcessedFilePaths(conf, sources, src).forEach((filePath) => {
        conf.logger?.error(`Error on sharp stream ${filePath}:`, err);
        imageRemoved(filePath);
      });
    }
  };
}

process.on('message', (data) => {});
