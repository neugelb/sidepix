import { PictureProps, ServerSideConf, ValueReference } from '../../core';
import { processImage } from './sendMessages';

export type MakeRenderer<ConfT extends ServerSideConf, OutputT> = (
  conf: ConfT,
  confRef: ValueReference,
) => (props: PictureProps) => OutputT;

export function withImageProcessing<ConfT extends ServerSideConf, OutputT>(
  makeRenderer: MakeRenderer<ConfT, OutputT>,
): MakeRenderer<ConfT, OutputT> {
  return (conf, confRef) => {
    const render = makeRenderer(conf, confRef);

    const newRender = (props: PictureProps) => {
      void processImage(confRef, props);
      return render(props);
    };

    Object.defineProperty(newRender, 'name', {
      writable: true,
      value: render.name,
    });

    return newRender;
  };
}
