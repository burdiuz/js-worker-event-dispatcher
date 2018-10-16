import MessagePortDispatcher from '@actualwave/messageport-dispatcher';

/**
 *
 * @param target {String|Worker}
 * @param customPostMessageHandler {?Function}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends MessagePortDispatcher
 * @constructor
 */
class AbstractDispatcher extends MessagePortDispatcher {
  constructor(
    type,
    target,
    receiverEventPreprocessor = null,
    senderEventPreprocessor = null,
  ) {
    super(
      target,
      (data, targetOrigin, transferList) => target.postMessage(data, transferList),
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );

    this.type = type;
  }
}

export default AbstractDispatcher;
