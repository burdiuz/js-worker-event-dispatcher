import type { EventProcessor } from '@actualwave/event-dispatcher';
import AbstractDispatcher from './AbstractDispatcher';
declare class SharedWorkerDispatcher extends AbstractDispatcher {
    worker: SharedWorker;
    private _cleanup;
    constructor(target: SharedWorker | string, name?: string, receiverEventPreprocessor?: EventProcessor | null, senderEventPreprocessor?: EventProcessor | null);
    start(): void;
    close(): void;
}
export default SharedWorkerDispatcher;
