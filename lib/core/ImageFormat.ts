import type { FormatEnum } from 'sharp';

export enum ImageFormat {
  AVIF = 'avif',
  WEBP = 'webp',
  JPEG = 'jpeg',
  PNG = 'png',
  SVG = 'svg',
  GIF = 'gif',
  UNKNOWN = 'unknown',
}

export function formatToMimeType(format: ImageFormat): string | undefined {
  return format !== ImageFormat.UNKNOWN ? `image/${format}` : undefined;
}

export function mimeTypeToFormat(mimeType: string): ImageFormat {
  return (
    {
      'image/avif': ImageFormat.AVIF,
      'image/webp': ImageFormat.WEBP,
      'image/jpg': ImageFormat.JPEG,
      'image/jpeg': ImageFormat.JPEG,
      'image/png': ImageFormat.PNG,
      'image/svg+xml': ImageFormat.SVG,
      'image/gif': ImageFormat.GIF,
    }[mimeType] ?? ImageFormat.UNKNOWN
  );
}

export function formatToExtension(format: ImageFormat): string {
  return format === ImageFormat.UNKNOWN ? '' : `.${format}`;
}

export function extensionToFormat(ext: string): ImageFormat {
  return (
    {
      '.avif': ImageFormat.AVIF,
      '.jpeg': ImageFormat.JPEG,
      '.jpg': ImageFormat.JPEG,
      '.png': ImageFormat.PNG,
      '.svg': ImageFormat.SVG,
      '.webp': ImageFormat.WEBP,
      '.gif': ImageFormat.GIF,
    }[ext] ?? ImageFormat.UNKNOWN
  );
}

export function fileNameToFormat(fileName: string): ImageFormat {
  const ext = /(\.[^.]*)$/.exec(fileName)?.[1] ?? '';
  return extensionToFormat(ext);
}

export function sharpFormatToImageFormat(
  format?: keyof FormatEnum,
): ImageFormat {
  switch (format) {
    case 'avif':
      return ImageFormat.AVIF;
    case 'jpeg':
      return ImageFormat.JPEG;
    case 'jpg':
      return ImageFormat.JPEG;
    case 'png':
      return ImageFormat.PNG;
    case 'svg':
      return ImageFormat.SVG;
    case 'webp':
      return ImageFormat.WEBP;
    case 'gif':
      return ImageFormat.GIF;
    default:
      return ImageFormat.UNKNOWN;
  }
}
