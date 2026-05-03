import type { EventProcessor, IEventDispatcher } from '@actualwave/event-dispatcher';
import ServiceClientDispatcher from './ClientDispatcher';
declare class ServiceServerDispatcher {
    type: string;
    target: EventTarget;
    receiver: IEventDispatcher;
    clientFactory: (port?: MessagePort) => ServiceClientDispatcher | null;
    private _cleanup;
    constructor(target?: EventTarget, receiverEventPreprocessor?: EventProcessor, clientReceiverEventPreprocessor?: EventProcessor, clientSenderEventPreprocessor?: EventProcessor);
    addEventListener: (...args: Parameters<IEventDispatcher["addEventListener"]>) => void;
    hasEventListener: (...args: Parameters<IEventDispatcher["hasEventListener"]>) => boolean;
    removeEventListener: (...args: Parameters<IEventDispatcher["removeEventListener"]>) => void;
    removeAllEventListeners: (...args: Parameters<IEventDispatcher["removeAllEventListeners"]>) => void;
    destroy(): void;
    private _messageListener;
}
export default ServiceServerDispatcher;
