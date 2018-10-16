import { isObject } from '@actualwave/event-dispatcher';
import WorkerType from './WorkerType';
import { dispatchWorkerEvents } from './WorkerEvent';
import AbstractDispatcher from './AbstractDispatcher';

const getTarget = (worker) => {
  // eslint-disable-next-line no-restricted-globals
  let target = worker || self;

  if (!isObject(target)) {
    target = new Worker(String(worker));
  }

  return target;
};

/**
 *
 * @param target {Worker|String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends MessagePortDispatcher
 * @constructor
 */
class DedicatedWorkerDispatcher extends AbstractDispatcher {
  constructor(worker, receiverEventPreprocessor, senderEventPreprocessor) {
    super(
      WorkerType.DEDICATED_WORKER,
      getTarget(worker),
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );

    dispatchWorkerEvents(this.target, this.receiver);
  }

  terminate() {
    return this.target.terminate();
  }
}

export default DedicatedWorkerDispatcher;
