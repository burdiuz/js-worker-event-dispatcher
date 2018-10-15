import { isObject } from '@actualwave/event-dispatcher';
import WorkerType from './WorkerType';
import { dispatchWorkerErrorEvent } from './WorkerEvent';
import AbstractDispatcher from './AbstractDispatcher';

const getTarget = (target, name) => {
  if (!isObject(target)) {
    return new SharedWorker(String(target), name);
  }

  return target;
};

/**
 *
 * @param worker {SharedWorker}
 * @param name {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class SharedWorkerDispatcher extends AbstractDispatcher {
  constructor(target, name, receiverEventPreprocessor, senderEventPreprocessor) {
    const worker = getTarget(target, name);

    super(WorkerType.SHARED_WORKER, worker.port, receiverEventPreprocessor, senderEventPreprocessor);

    this.worker = worker;

    dispatchWorkerErrorEvent(this.worker, this.receiver);
  }

  start() {
    this.target.start();
  }

  close() {
    this.target.close();
  }
}

export default SharedWorkerDispatcher;
