/**
 *
 * @param port {Worker|MessagePort}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends MessagePortDispatcher
 * @constructor
 */
class WorkerMessenger extends MessagePortDispatcher {
  constructor(port, receiverEventPreprocessor, senderEventPreprocessor) {
    super(
      port,
      (data, transferList) => {
        port.postMessage(data, transferList);
      },
      receiverEventPreprocessor,
      senderEventPreprocessor
    );
  }

  static setScopeHandlers(source, target) {
    WorkerEvent.createHandler(Event.ERROR, source, target);
    WorkerEvent.createHandler(Event.LANGUAGECHANGE, source, target);
    WorkerEvent.createHandler(Event.ONLINE, source, target);
    WorkerEvent.createHandler(Event.OFFLINE, source, target);
  }

  static setAbstractWorkerHandlers(source, target) {
    WorkerEvent.createHandler(Event.ERROR, source, target);
  }
}

export default WorkerMessenger;