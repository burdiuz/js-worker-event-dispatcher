import { jest } from '@jest/globals';
export interface EventTargetInstance {
    type: string;
    addEventListener: ReturnType<typeof jest.fn>;
    hasEventListener: ReturnType<typeof jest.fn>;
    removeEventListener: ReturnType<typeof jest.fn>;
}
export interface MessagePortBaseInstance extends EventTargetInstance {
    postMessage: ReturnType<typeof jest.fn>;
}
export interface MessagePortInstance extends MessagePortBaseInstance {
    start: ReturnType<typeof jest.fn>;
    close: ReturnType<typeof jest.fn>;
}
export interface WorkerInstance extends MessagePortBaseInstance {
    terminate: ReturnType<typeof jest.fn>;
}
export interface SharedWorkerInstance extends EventTargetInstance {
    port: MessagePortInstance;
}
type MockedConstructor<T> = ReturnType<typeof jest.fn> & (new (...args: any[]) => T);
export declare const EventTarget: MockedConstructor<EventTargetInstance>;
export declare const MessagePortBase: MockedConstructor<MessagePortBaseInstance>;
export declare const MessagePort: MockedConstructor<MessagePortInstance>;
export declare const Worker: MockedConstructor<WorkerInstance>;
export declare const SharedWorker: MockedConstructor<SharedWorkerInstance>;
export declare const apply: () => void;
export {};
