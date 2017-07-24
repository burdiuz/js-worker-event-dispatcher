/**
 *
 * @param worker {String|Worker}
 * @param type {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class WorkerEventDispatcher extends WorkerMessenger {
  constructor(worker, receiverEventPreprocessor, senderEventPreprocessor, type) {
    super(worker, receiverEventPreprocessor, senderEventPreprocessor);
    this.type = type;
  }
}

export default WorkerEventDispatcher;
