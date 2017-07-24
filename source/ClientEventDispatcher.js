
/**
 * @param port {MessagePort}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends WorkerMessenger
 * @constructor
 */
class ClientEventDispatcher extends WorkerEventDispatcher{
  constructor(port, receiverEventPreprocessor, senderEventPreprocessor) {
    super(port, receiverEventPreprocessor, senderEventPreprocessor, WorkerType.SHARED_WORKER_CLIENT);
  }
  function start() {
    port.start();
  }

  function close() {
    port.close();
  }

  this.start = start;
  this.close = close;
}

export default ClientEventDispatcher;

