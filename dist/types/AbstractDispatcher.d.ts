import MessagePortDispatcher from '@actualwave/messageport-dispatcher';
import type { EventProcessor } from '@actualwave/event-dispatcher';
export interface WorkerLike {
    postMessage(data: unknown, transferList?: Transferable[]): void | Promise<void>;
    addEventListener(type: string, handler: (event: any) => void): void;
    removeEventListener(type: string, handler: (event: any) => void): void;
}
declare class AbstractDispatcher extends MessagePortDispatcher {
    type: string;
    constructor(type: string, target: WorkerLike, receiverEventPreprocessor?: EventProcessor | null, senderEventPreprocessor?: EventProcessor | null);
}
export default AbstractDispatcher;
