import type { EventProcessor } from '@actualwave/event-dispatcher';
import WorkerType from '../WorkerType';
import AbstractDispatcher, { type WorkerLike } from '../AbstractDispatcher';

class ServiceClientDispatcher extends AbstractDispatcher {
  constructor(
    target: MessagePort,
    receiverEventPreprocessor?: EventProcessor | null,
    senderEventPreprocessor?: EventProcessor | null,
  ) {
    super(
      WorkerType.SERVICE_WORKER_CLIENT,
      target as unknown as WorkerLike,
      receiverEventPreprocessor ?? null,
      senderEventPreprocessor ?? null,
    );
  }

  start(): void {
    (this.target as unknown as MessagePort).start();
  }

  close(): void {
    (this.target as unknown as MessagePort).close();
  }
}

export default ServiceClientDispatcher;
