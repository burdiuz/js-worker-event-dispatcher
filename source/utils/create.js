/* eslint-disable no-restricted-globals */
import WorkerType from '../WorkerType';
import DedicatedWorkerDispatcher from '../DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';
import SharedClientDispatcher from '../sharedWorker/ClientDispatcher';
import SharedServerDispatcher from '../sharedWorker/ServerDispatcher';
import ServiceWorkerDispatcher from '../ServiceWorkerDispatcher';
import ServiceClientDispatcher from '../serviceWorker/ClientDispatcher';
import ServiceServerDispatcher from '../serviceWorker/ServerDispatcher';

export const createForDedicatedWorker = (
  target,
  receiverEventPreprocessor,
  senderEventPreprocessor,
) => new DedicatedWorkerDispatcher(
  target,
  receiverEventPreprocessor,
  senderEventPreprocessor,
);

export const createForSharedWorker = (
  target,
  receiverEventPreprocessor,
  senderEventPreprocessor,
) => new SharedWorkerDispatcher(
  target,
  null,
  receiverEventPreprocessor,
  senderEventPreprocessor,
);

export const createForServiceWorker = (
  receiverEventPreprocessor,
  senderEventPreprocessor,
) => new ServiceWorkerDispatcher(
  receiverEventPreprocessor,
  senderEventPreprocessor,
);

/**
 *
 * @param worker {String|Worker|SharedWorker|MessagePort}
 * @param type {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {AbstractDispatcher}
 */
export const create = (
  target,
  type,
  receiverEventPreprocessor,
  senderEventPreprocessor,
) => {
  switch (type) {
    default:
    case WorkerType.DEDICATED_WORKER:
      return createForDedicatedWorker(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SHARED_WORKER:
      return createForSharedWorker(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SHARED_WORKER_SERVER:
      return new SharedServerDispatcher(target, receiverEventPreprocessor);
    case WorkerType.SHARED_WORKER_CLIENT:
      return new SharedClientDispatcher(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SERVICE_WORKER:
      return createForServiceWorker(
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SERVICE_WORKER_SERVER:
      return new ServiceServerDispatcher(target, receiverEventPreprocessor);
    case WorkerType.SERVICE_WORKER_CLIENT:
      return new ServiceClientDispatcher(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
  }
};

/**
 *
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {AbstractDispatcher}
 */
export const createForSelf = (
  receiverEventPreprocessor,
  senderEventPreprocessor,
) => {
  // Only dedicated WebWorker has postMessage since they have single client
  if (typeof self.postMessage === 'function') {
    return new DedicatedWorkerDispatcher(
      self,
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );
  }

  // Only ServiceWorker has registration object
  if (self.registration && typeof self.registration.scope === 'string') {
    return new ServiceServerDispatcher(self, receiverEventPreprocessor);
  }

  return new SharedServerDispatcher(self, receiverEventPreprocessor);
};
