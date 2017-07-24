
/**
 *
 * @param worker {SharedWorker}
 * @param name {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class SharedWorkerEventDispatcher extends ClientEventDispatcher{
  constructor(worker, name, receiverEventPreprocessor, senderEventPreprocessor) {
    super(_target.port, receiverEventPreprocessor, senderEventPreprocessor);

    this.type = WorkerType.SHARED_WORKER;
    var _target = worker;
    if (!EventDispatcher.isObject(worker)) {
      _target = new SharedWorker(String(worker), name);
    }
    WorkerMessenger.setAbstractWorkerHandlers(_target, this.receiver);
  }
}

  export default SharedWorkerEventDispatcher;

  SharedWorkerEventDispatcher.prototype = new (NOINIT, null, null);
.prototype.constructor = SharedWorkerEventDispatcher;
