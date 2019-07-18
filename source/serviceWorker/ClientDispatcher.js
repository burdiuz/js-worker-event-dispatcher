import WorkerType from '../WorkerType';
import AbstractDispatcher from '../AbstractDispatcher';

/**
 * @param target {MessagePort}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends MessagePortDispatcher
 * @constructor
 */
class ServiceClientDispatcher extends AbstractDispatcher {
  constructor(target, receiverEventPreprocessor, senderEventPreprocessor) {
    super(
      WorkerType.SERVICE_WORKER_CLIENT,
      target,
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );
  }

  start() {
    this.target.start();
  }

  close() {
    this.target.close();
  }
}

export default ServiceClientDispatcher;
