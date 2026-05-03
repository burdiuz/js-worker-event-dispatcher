/* eslint-disable @typescript-eslint/no-explicit-any */
import MessagePortDispatcher from '@actualwave/messageport-dispatcher';
import type { EventProcessor } from '@actualwave/event-dispatcher';

export interface WorkerLike {
  postMessage(data: unknown, transferList?: Transferable[]): void | Promise<void>;
  addEventListener(type: string, handler: (event: any) => void): void;
  removeEventListener(type: string, handler: (event: any) => void): void;
}

class AbstractDispatcher extends MessagePortDispatcher {
  type: string;

  constructor(
    type: string,
    target: WorkerLike,
    receiverEventPreprocessor: EventProcessor | null = null,
    senderEventPreprocessor: EventProcessor | null = null,
  ) {
    super(
      target as any,
      (_data: unknown, _targetOrigin: string, _transferList?: Transferable[]) => {
        target.postMessage(_data, _transferList);
      },
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );

    this.type = type;
  }
}

export default AbstractDispatcher;
