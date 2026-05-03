import { isObject } from '@actualwave/event-dispatcher';
import type { EventProcessor } from '@actualwave/event-dispatcher';
import WorkerType from './WorkerType';
import { dispatchWorkerEvents } from './WorkerEvent';
import AbstractDispatcher, { type WorkerLike } from './AbstractDispatcher';

const getTarget = (worker?: Worker | string): WorkerLike => {
  // eslint-disable-next-line no-restricted-globals
  const target: unknown = worker ?? self;

  if (!isObject(target)) {
    return new Worker(String(worker));
  }

  return target as WorkerLike;
};

class DedicatedWorkerDispatcher extends AbstractDispatcher {
  private _cleanup!: () => void;

  constructor(
    worker?: Worker | string,
    receiverEventPreprocessor?: EventProcessor | null,
    senderEventPreprocessor?: EventProcessor | null,
  ) {
    const target = getTarget(worker);

    super(
      WorkerType.DEDICATED_WORKER,
      target,
      receiverEventPreprocessor ?? null,
      senderEventPreprocessor ?? null,
    );

    this._cleanup = dispatchWorkerEvents(this.target as unknown as EventTarget, this.receiver);
  }

  terminate(): void {
    this._cleanup();
    (this.target as unknown as Worker).terminate();
  }
}

export default DedicatedWorkerDispatcher;
