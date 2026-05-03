import type { EventProcessor } from '@actualwave/event-dispatcher';
import AbstractDispatcher from './AbstractDispatcher';
declare class DedicatedWorkerDispatcher extends AbstractDispatcher {
    private _cleanup;
    constructor(worker?: Worker | string, receiverEventPreprocessor?: EventProcessor | null, senderEventPreprocessor?: EventProcessor | null);
    terminate(): void;
}
export default DedicatedWorkerDispatcher;
