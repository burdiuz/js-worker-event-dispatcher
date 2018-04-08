import MessagePortDispatcher from '@actualwave/messageport-dispatcher';

/**
 *
 * @param target {String|Worker}
 * @param type {String}
 * @param receiverEventPreprocessor {?Function}
 * @param senderEventPreprocessor {?Function}
 * @extends MessagePortDispatcher
 * @constructor
 */
class AbstractDispatcher extends MessagePortDispatcher {
  constructor(type) {
    super(null, null, null, null, true);
    this.type = type;
  }

  initialize(
    target,
    customPostMessageHandler = null,
    receiverEventPreprocessor = null,
    senderEventPreprocessor = null,
  ) {
    const postMessageHandler = (data, targetOrigin, transferList) =>
      target.postMessage(data, transferList);

    super.initialize(
      target,
      customPostMessageHandler || postMessageHandler,
      receiverEventPreprocessor,
      senderEventPreprocessor,
    );
  }
}

export default AbstractDispatcher;
