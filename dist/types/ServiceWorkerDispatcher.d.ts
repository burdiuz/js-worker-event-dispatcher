import type { EventProcessor } from '@actualwave/event-dispatcher';
import AbstractDispatcher from './AbstractDispatcher';
declare class ServiceWorkerDispatcher extends AbstractDispatcher {
    private _cleanupErrors;
    constructor(receiverEventPreprocessor?: EventProcessor | null, senderEventPreprocessor?: EventProcessor | null);
    start(): void;
    close(): void;
    onReady(handler: (registration: ServiceWorkerRegistration) => void): Promise<void>;
    get ready(): Promise<ServiceWorkerRegistration>;
}
export default ServiceWorkerDispatcher;
