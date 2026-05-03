/* eslint-disable no-restricted-globals */
import type { EventProcessor } from '@actualwave/event-dispatcher';
import WorkerType from '../WorkerType';
import DedicatedWorkerDispatcher from '../DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';
import SharedClientDispatcher from '../sharedWorker/ClientDispatcher';
import SharedServerDispatcher from '../sharedWorker/ServerDispatcher';
import ServiceWorkerDispatcher from '../ServiceWorkerDispatcher';
import ServiceClientDispatcher from '../serviceWorker/ClientDispatcher';
import ServiceServerDispatcher from '../serviceWorker/ServerDispatcher';

export const createForDedicatedWorker = (
  target?: Worker | string,
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
): DedicatedWorkerDispatcher =>
  new DedicatedWorkerDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);

export const createForSharedWorker = (
  target: SharedWorker | string,
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
): SharedWorkerDispatcher =>
  new SharedWorkerDispatcher(target, undefined, receiverEventPreprocessor, senderEventPreprocessor);

export const createForServiceWorker = (
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
): ServiceWorkerDispatcher =>
  new ServiceWorkerDispatcher(receiverEventPreprocessor, senderEventPreprocessor);

export const create = (
  target: Worker | SharedWorker | MessagePort | EventTarget | string | undefined,
  type?: string,
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
):
  | DedicatedWorkerDispatcher
  | SharedWorkerDispatcher
  | SharedServerDispatcher
  | SharedClientDispatcher
  | ServiceWorkerDispatcher
  | ServiceServerDispatcher
  | ServiceClientDispatcher => {
  switch (type) {
    default:
    case WorkerType.DEDICATED_WORKER:
      return createForDedicatedWorker(
        target as Worker | string | undefined,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SHARED_WORKER:
      return createForSharedWorker(
        target as SharedWorker | string,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SHARED_WORKER_SERVER:
      return new SharedServerDispatcher(target as EventTarget, receiverEventPreprocessor ?? undefined);
    case WorkerType.SHARED_WORKER_CLIENT:
      return new SharedClientDispatcher(
        target as MessagePort,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SERVICE_WORKER:
      return createForServiceWorker(receiverEventPreprocessor, senderEventPreprocessor);
    case WorkerType.SERVICE_WORKER_SERVER:
      return new ServiceServerDispatcher(target as EventTarget, receiverEventPreprocessor ?? undefined);
    case WorkerType.SERVICE_WORKER_CLIENT:
      return new ServiceClientDispatcher(
        target as MessagePort,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
  }
};

export const createForSelf = (
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
): DedicatedWorkerDispatcher | ServiceServerDispatcher | SharedServerDispatcher => {
  // Only dedicated WebWorker has postMessage since they have single client
  if (typeof (self as unknown as Record<string, unknown>).postMessage === 'function') {
    return new DedicatedWorkerDispatcher(
      self as unknown as Worker,
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );
  }

  // Only ServiceWorker has registration object
  const selfRecord = self as unknown as Record<string, unknown>;
  if (selfRecord.registration && typeof (selfRecord.registration as Record<string, unknown>).scope === 'string') {
    return new ServiceServerDispatcher(self as unknown as EventTarget, receiverEventPreprocessor ?? undefined);
  }

  return new SharedServerDispatcher(self as unknown as EventTarget, receiverEventPreprocessor ?? undefined);
};
