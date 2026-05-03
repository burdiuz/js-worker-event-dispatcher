import type { EventProcessor, IEventDispatcher } from '@actualwave/event-dispatcher';
import SharedClientDispatcher from './ClientDispatcher';
declare class SharedServerDispatcher {
    type: string;
    target: EventTarget;
    receiver: IEventDispatcher;
    clientFactory: (client: MessagePort) => SharedClientDispatcher;
    private _cleanup;
    constructor(target?: EventTarget, receiverEventPreprocessor?: EventProcessor, clientReceiverEventPreprocessor?: EventProcessor, clientSenderEventPreprocessor?: EventProcessor);
    addEventListener: (...args: Parameters<IEventDispatcher["addEventListener"]>) => void;
    hasEventListener: (...args: Parameters<IEventDispatcher["hasEventListener"]>) => boolean;
    removeEventListener: (...args: Parameters<IEventDispatcher["removeEventListener"]>) => void;
    removeAllEventListeners: (...args: Parameters<IEventDispatcher["removeAllEventListeners"]>) => void;
    destroy(): void;
    handleConnect: (event: Event) => void;
}
export default SharedServerDispatcher;
