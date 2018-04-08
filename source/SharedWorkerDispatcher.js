import EventDispatcher from '@actualwave/event-dispatcher';
import WorkerType from './WorkerType';
import { dispatchWorkerErrorEvent } from './WorkerEvent';
import AbstractDispatcher from './AbstractDispatcher';

const getTarget = (target, name) => {
  if (!EventDispatcher.isObject(target)) {
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
    super(WorkerType.SHARED_WORKER);
    this.worker = getTarget(target, name);

    this.initialize(this.worker.port, null, receiverEventPreprocessor, senderEventPreprocessor);
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
