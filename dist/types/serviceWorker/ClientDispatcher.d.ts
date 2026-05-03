import type { EventProcessor } from '@actualwave/event-dispatcher';
import AbstractDispatcher from '../AbstractDispatcher';
declare class ServiceClientDispatcher extends AbstractDispatcher {
    constructor(target: MessagePort, receiverEventPreprocessor?: EventProcessor | null, senderEventPreprocessor?: EventProcessor | null);
    start(): void;
    close(): void;
}
export default ServiceClientDispatcher;
