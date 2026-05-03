import type { EventProcessor } from '@actualwave/event-dispatcher';
import AbstractDispatcher from '../AbstractDispatcher';
declare class SharedClientDispatcher extends AbstractDispatcher {
    constructor(target: MessagePort, receiverEventPreprocessor?: EventProcessor | null, senderEventPreprocessor?: EventProcessor | null);
    start(): void;
    close(): void;
}
export default SharedClientDispatcher;
