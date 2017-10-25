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
  let dispatcher = null;
  switch (type) {
    default:
    case WorkerType.DEDICATED_WORKER:
      dispatcher = new DedicatedWorkerDispatcher(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
      break;
    case WorkerType.SHARED_WORKER:
      dispatcher = new SharedWorkerDispatcher(
        target,
        null,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
      break;
    case WorkerType.SHARED_WORKER_SERVER:
      dispatcher = new ServerDispatcher(
        target,
        receiverEventPreprocessor,
      );
      break;
    case WorkerType.SHARED_WORKER_CLIENT:
      dispatcher = new ClientDispatcher(
        target,
        receiverEventPreprocessor,
        senderEventPreprocessor,
      );
      break;
  }
  return dispatcher;
};

/**
 *
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {AbstractDispatcher}
 */
export const createForSelf = (receiverEventPreprocessor, senderEventPreprocessor) => {
  /* eslint-disable no-restricted-globals */
  let dispatcher = null;
  if (typeof (self.postMessage) === 'function') {
    dispatcher = new DedicatedWorkerDispatcher(
      self,
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );
  } else {
    dispatcher = new ServerDispatcher(
      self,
      receiverEventPreprocessor,
    );
  }
  return dispatcher;
  /* eslint-enable no-restricted-globals */
};
