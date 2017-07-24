
WorkerEventDispatcher.WorkerEvent = WorkerEvent;
WorkerEventDispatcher.WorkerType = WorkerType;
WorkerEventDispatcher.CONNECT_EVENT = WorkerEvent.CONNECT;
WorkerEventDispatcher.DEDICATED_WORKER = WorkerType.DEDICATED_WORKER;
WorkerEventDispatcher.SHARED_WORKER = WorkerType.SHARED_WORKER;

WorkerEventDispatcher.DedicatedWorker = DedicatedWorkerEventDispatcher;
WorkerEventDispatcher.SharedWorker = SharedWorkerEventDispatcher;
WorkerEventDispatcher.Server = ServerEventDispatcher;
WorkerEventDispatcher.Client = ClientEventDispatcher;

/**
 *
 * @param worker {String|Worker|SharedWorker|MessagePort}
 * @param type {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {WorkerEventDispatcher}
 */
WorkerEventDispatcher.create = function(target, type, receiverEventPreprocessor, senderEventPreprocessor) {
  var dispatcher = null;
  switch (type) {
    default:
    case WorkerType.DEDICATED_WORKER:
      dispatcher = new DedicatedWorkerEventDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
      break;
    case WorkerType.SHARED_WORKER:
      dispatcher = new SharedWorkerEventDispatcher(target, null, receiverEventPreprocessor, senderEventPreprocessor);
      break;
    case WorkerType.SHARED_WORKER_SERVER:
      dispatcher = new ServerEventDispatcher(target, receiverEventPreprocessor);
      break;
    case WorkerType.SHARED_WORKER_CLIENT:
      dispatcher = new ClientEventDispatcher(target, receiverEventPreprocessor, senderEventPreprocessor);
      break;
  }
  return dispatcher;
};

/**
 *
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @returns {WorkerEventDispatcher}
 */
WorkerEventDispatcher.self = function(receiverEventPreprocessor, senderEventPreprocessor) {
  var dispatcher = null;
  if (typeof(self.postMessage) === 'function') {
    dispatcher = new DedicatedWorkerEventDispatcher(self, receiverEventPreprocessor, senderEventPreprocessor);
  } else {
    dispatcher = new ServerEventDispatcher(self, receiverEventPreprocessor);
  }
  return dispatcher;
};
