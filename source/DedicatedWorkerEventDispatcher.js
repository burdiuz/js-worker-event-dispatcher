
/**
 *
 * @param worker {Worker|String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class DedicatedWorkerEventDispatcher extends WorkerEventDispatcher{
  constructor(worker, receiverEventPreprocessor, senderEventPreprocessor) {
  var _target = worker || self;

  if (!EventDispatcher.isObject(_target)) {
    _target = new Worker(String(worker));
  }

  WorkerMessenger.call(this, _target, receiverEventPreprocessor, senderEventPreprocessor);
  WorkerMessenger.setScopeHandlers(_target, this.receiver);

  function terminate() {
    return _target.terminate();
  }

  this.terminate = terminate;
}
DedicatedWorkerEventDispatcher.prototype = new WorkerEventDispatcher(NOINIT, null, null, WorkerType.DEDICATED_WORKER);
.prototype.constructor = DedicatedWorkerEventDispatcher;

  export default DedicatedWorkerEventDispatcher;
