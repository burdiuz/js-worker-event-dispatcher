import WorkerType from '../WorkerType';
import DedicatedWorkerDispatcher from '../DedicatedWorkerDispatcher';
import SharedWorkerDispatcher from '../SharedWorkerDispatcher';
import ClientDispatcher from '../sharedWorker/ClientDispatcher';
import ServerDispatcher from '../sharedWorker/ServerDispatcher';

/**
 *
 * @param worker {String|Worker|SharedWorker|MessagePort}
 * @param type {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {AbstractDispatcher}
 */
export const create = (target, type, receiverEventPreprocessor, senderEventPreprocessor) => {
  switch (type) {
    default:
    case WorkerType.DEDICATED_WORKER:
      return new DedicatedWorkerDispatcher(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SHARED_WORKER:
      return new SharedWorkerDispatcher(
        target,
        null,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
    case WorkerType.SHARED_WORKER_SERVER:
      return new ServerDispatcher(target, receiverEventPreprocessor);
    case WorkerType.SHARED_WORKER_CLIENT:
      return new ClientDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
  }
};

/**
 *
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {AbstractDispatcher}
 */
export const createForSelf = (receiverEventPreprocessor, senderEventPreprocessor) => {
  /* eslint-disable no-restricted-globals */
  if (typeof self.postMessage === 'function') {
    return new DedicatedWorkerDispatcher(self, receiverEventPreprocessor, senderEventPreprocessor);
  }

  return new ServerDispatcher(self, receiverEventPreprocessor);
  /* eslint-enable no-restricted-globals */
};
