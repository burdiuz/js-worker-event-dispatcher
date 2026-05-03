import { isObject } from '@actualwave/event-dispatcher';
import type { EventProcessor } from '@actualwave/event-dispatcher';
import WorkerType from './WorkerType';
import { dispatchWorkerErrorEvent } from './WorkerEvent';
import AbstractDispatcher, { type WorkerLike } from './AbstractDispatcher';

const getTarget = (target: SharedWorker | string, name?: string): SharedWorker => {
  if (!isObject(target)) {
    return new SharedWorker(String(target), name);
  }

  return target as SharedWorker;
};

class SharedWorkerDispatcher extends AbstractDispatcher {
  worker: SharedWorker;
  private _cleanup!: () => void;

  constructor(
    target: SharedWorker | string,
    name?: string,
    receiverEventPreprocessor?: EventProcessor | null,
    senderEventPreprocessor?: EventProcessor | null,
  ) {
    const worker = getTarget(target, name);

    super(
      WorkerType.SHARED_WORKER,
      worker.port as unknown as WorkerLike,
      receiverEventPreprocessor ?? null,
      senderEventPreprocessor ?? null,
    );

    this.worker = worker;

    this._cleanup = dispatchWorkerErrorEvent(this.worker as unknown as EventTarget, this.receiver);

    this.start();
  }

  start(): void {
    (this.target as unknown as MessagePort).start();
  }

  close(): void {
    this._cleanup();
    (this.target as unknown as MessagePort).close();
  }
}

export default SharedWorkerDispatcher;
