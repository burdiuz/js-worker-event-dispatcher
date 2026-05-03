# @actualwave/worker-dispatcher

[![npm](https://img.shields.io/npm/v/@actualwave/worker-dispatcher)](https://www.npmjs.com/package/@actualwave/worker-dispatcher)

Named-event communication layer for Dedicated Workers, Shared Workers, and Service Workers. Built on top of [@actualwave/messageport-dispatcher](https://github.com/burdiuz/js-messageport-event-dispatcher), it replaces raw `postMessage`/`message` boilerplate with typed named events on both sides of every worker channel.

## Installation

```bash
npm install @actualwave/worker-dispatcher
# or
yarn add @actualwave/worker-dispatcher
```

## Core concepts

- **`DedicatedWorkerDispatcher`** — wraps a `Worker` on the main thread (or `self` inside the worker).
- **`SharedWorkerDispatcher`** — wraps a `SharedWorker` on the main thread; handles the `MessagePort` internally.
- **`ServiceWorkerDispatcher`** — wraps a `MessageChannel` to the active Service Worker; auto-recovers when the worker restarts.
- **Server dispatchers** (`SharedServerDispatcher`, `ServiceServerDispatcher`) — used inside the worker script to receive connections and events.
- **Client dispatchers** (`SharedClientDispatcher`, `ServiceClientDispatcher`) — one instance per connected client, created automatically on each new connection.
- **`WorkerEvent`** — extends `Event`; carries `nativeEvent`, `client`, `type`, and `data`.
- **`WorkerType`** — string enum of all dispatcher type identifiers.

## Usage

### 1. Dedicated Worker

**Main thread:**

```typescript
import { DedicatedWorkerDispatcher } from '@actualwave/worker-dispatcher';

const dispatcher = new DedicatedWorkerDispatcher('/workers/worker.js');

dispatcher.addEventListener('result', (event) => {
  console.log('Worker result:', event.data);
});

dispatcher.dispatchEvent('compute', { input: [1, 2, 3] });
```

**Inside the worker (`worker.js`):**

```typescript
import { createForSelf } from '@actualwave/worker-dispatcher';

const dispatcher = createForSelf();

dispatcher.addEventListener('compute', (event) => {
  dispatcher.dispatchEvent('result', { output: (event.data as any).input.map(Number) });
});
```

### 2. Shared Worker

**Main thread:**

```typescript
import { SharedWorkerDispatcher } from '@actualwave/worker-dispatcher';

const dispatcher = new SharedWorkerDispatcher('/workers/shared.js');
// start() is called automatically in the constructor

dispatcher.addEventListener('broadcast', (event) => {
  console.log('Broadcast from worker:', event.data);
});

dispatcher.dispatchEvent('subscribe', { topic: 'news' });
```

**Inside the shared worker (`shared.js`):**

```typescript
import { createForSelf } from '@actualwave/worker-dispatcher';
import WorkerEvent from '@actualwave/worker-dispatcher/WorkerEvent';

const server = createForSelf(); // returns SharedServerDispatcher

server.addEventListener(WorkerEvent.CONNECT, (event) => {
  const client = event.client; // SharedClientDispatcher
  client.start();

  client.addEventListener('subscribe', (e) => {
    console.log('Client subscribed to', (e.data as any).topic);
    client.dispatchEvent('broadcast', { message: 'Welcome!' });
  });
});
```

Close a client when done:

```typescript
client.close();
```

### 3. Service Worker

**Main thread (registers and communicates with a Service Worker):**

```typescript
import { ServiceWorkerDispatcher } from '@actualwave/worker-dispatcher';

const dispatcher = new ServiceWorkerDispatcher();

dispatcher.onReady((registration) => {
  console.log('Service worker ready');
  dispatcher.dispatchEvent('init', { config: { offline: true } });
});

dispatcher.addEventListener('push-received', (event) => {
  console.log('Push data:', event.data);
});
```

**Inside the service worker (`sw.js`):**

```typescript
import { ServiceServerDispatcher } from '@actualwave/worker-dispatcher';
import WorkerEvent from '@actualwave/worker-dispatcher/WorkerEvent';

const server = new ServiceServerDispatcher();

server.addEventListener('init', (event) => {
  console.log('Config received:', event.data);
  const client = event.client; // ServiceClientDispatcher
  if (client) {
    client.dispatchEvent('ack', { ok: true });
  }
});

// Lifecycle events are wired automatically
server.addEventListener(WorkerEvent.INSTALL, (e) => {
  (e.nativeEvent as ExtendableEvent).waitUntil(caches.open('v1'));
});
```

### 4. Factory functions

```typescript
import {
  create,
  createForSelf,
  createForDedicatedWorker,
  createForSharedWorker,
  createForServiceWorker,
  WorkerType,
} from '@actualwave/worker-dispatcher';

// auto-detect from a target object
const d1 = create(worker, WorkerType.DEDICATED_WORKER);
const d2 = create(sharedWorker, WorkerType.SHARED_WORKER);

// inside a worker script — auto-detects context
const dispatcher = createForSelf();

// explicit per-type helpers
const dw = createForDedicatedWorker('/worker.js');
const sw = createForSharedWorker('/shared.js');
const svc = createForServiceWorker();
```

### 5. Event preprocessors

Transform every incoming or outgoing event:

```typescript
import type { EventProcessor } from '@actualwave/event-dispatcher';

const stamp: EventProcessor = (event) => ({
  ...event,
  data: { ...(event.data as object), ts: Date.now() },
});

const dispatcher = new DedicatedWorkerDispatcher(
  '/worker.js',
  stamp,   // receiverEventPreprocessor
  stamp,   // senderEventPreprocessor
);
```

## API reference

### `DedicatedWorkerDispatcher`

```typescript
new DedicatedWorkerDispatcher(
  worker?: Worker | string,
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
)
```

| Member | Description |
|---|---|
| `addEventListener(type, listener, priority?)` | Listen for events from the worker. |
| `hasEventListener(type)` | Check if listener exists. |
| `removeEventListener(type, listener)` | Remove a listener. |
| `removeAllEventListeners(type)` | Remove all listeners for a type. |
| `dispatchEvent(type, data?, transferList?)` | Send an event to the worker. |
| `receiver` | `IEventDispatcher` for incoming events. |
| `sender` | `IEventDispatcher` for outgoing echo. |
| `target` | Underlying `Worker` or `WorkerLike`. |
| `terminate()` | Terminate the worker and clean up listeners. |

### `SharedWorkerDispatcher`

```typescript
new SharedWorkerDispatcher(
  target: SharedWorker | string,
  name?: string,
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
)
```

| Member | Description |
|---|---|
| `start()` | Start the port (called automatically). |
| `close()` | Close the port and clean up listeners. |
| `worker` | The underlying `SharedWorker` instance. |
| *(inherits all dispatcher methods)* | |

### `ServiceWorkerDispatcher`

```typescript
new ServiceWorkerDispatcher(
  receiverEventPreprocessor?: EventProcessor | null,
  senderEventPreprocessor?: EventProcessor | null,
)
```

| Member | Description |
|---|---|
| `start()` | Start the internal `MessageChannel` port. |
| `close()` | Close the port and remove error listeners. |
| `ready` | `Promise<ServiceWorkerRegistration>` |
| `onReady(handler)` | Calls handler when the SW registration resolves. Returns `Promise<void>`. |
| *(inherits all dispatcher methods)* | |

Auto-recovers the `MessageChannel` when the active Service Worker changes (e.g., after an update).

### `SharedServerDispatcher` (inside a Shared Worker)

```typescript
new SharedServerDispatcher(
  target?: EventTarget,      // defaults to self
  receiverEventPreprocessor?: EventProcessor,
  clientReceiverEventPreprocessor?: EventProcessor,
  clientSenderEventPreprocessor?: EventProcessor,
)
```

| Member | Description |
|---|---|
| `addEventListener(type, listener)` | Listen for connect and worker-lifecycle events. |
| `destroy()` | Remove all native listeners from the target. |
| `receiver` | `IEventDispatcher` for dispatched events. |

Fires `WorkerEvent.CONNECT` whenever a new client connects. The event's `.client` is a `SharedClientDispatcher`.

### `ServiceServerDispatcher` (inside a Service Worker)

```typescript
new ServiceServerDispatcher(
  target?: EventTarget,      // defaults to self
  receiverEventPreprocessor?: EventProcessor,
  clientReceiverEventPreprocessor?: EventProcessor,
  clientSenderEventPreprocessor?: EventProcessor,
)
```

Automatically registers listeners for `error`, `messageerror`, `install`, `activate`, `fetch`, `sync`, and `push` on `target`. The event's `.client` is a `ServiceClientDispatcher` when a port was transferred.

| Member | Description |
|---|---|
| `destroy()` | Remove all native listeners from the target. |

### `SharedClientDispatcher` / `ServiceClientDispatcher`

One instance per client connection. Returned via `event.client` on connect/message events.

| Member | Description |
|---|---|
| `start()` | Start the `MessagePort`. |
| `close()` | Close the `MessagePort`. |
| `dispatchEvent(type, data?)` | Send an event to this specific client. |
| *(inherits all dispatcher methods)* | |

### `WorkerEvent`

Static event type constants (all prefixed `worker:`):

| Constant | Value | When fired |
|---|---|---|
| `WorkerEvent.CONNECT` | `'worker:connect'` | New client connected (Shared Worker) |
| `WorkerEvent.MESSAGE` | `'worker:message'` | Incoming message |
| `WorkerEvent.ERROR` | `'worker:error'` | Worker error |
| `WorkerEvent.MESSAGEERROR` | `'worker:messageerror'` | Message deserialization error |
| `WorkerEvent.LANGUAGECHANGE` | `'worker:languagechange'` | Language changed |
| `WorkerEvent.ONLINE` | `'worker:online'` | Network online |
| `WorkerEvent.OFFLINE` | `'worker:offline'` | Network offline |
| `WorkerEvent.INSTALL` | `'worker:install'` | SW install event |
| `WorkerEvent.ACTIVATE` | `'worker:activate'` | SW activate event |
| `WorkerEvent.FETCH` | `'worker:fetch'` | SW fetch event |
| `WorkerEvent.SYNC` | `'worker:sync'` | SW background sync |
| `WorkerEvent.PUSH` | `'worker:push'` | SW push notification |

Instance properties:

| Property | Type | Description |
|---|---|---|
| `type` | `string` | The worker-prefixed event type |
| `data` | `unknown` | Event payload |
| `nativeEvent` | `unknown` | The original native DOM event |
| `client` | `unknown` | Client dispatcher, or `null` |

### `WorkerType`

String constants used with `create()`:

| Constant | Value |
|---|---|
| `WorkerType.DEDICATED_WORKER` | `'dedicated'` |
| `WorkerType.SHARED_WORKER` | `'shared'` |
| `WorkerType.SERVICE_WORKER` | `'service'` |

### `NativeEventType`

Raw DOM event type strings: `'connect'`, `'message'`, `'error'`, `'messageerror'`, `'install'`, `'activate'`, `'fetch'`, `'sync'`, `'push'`, `'languagechange'`, `'online'`, `'offline'`.

### Utility: `dispatchWorkerEvent / dispatchWorkerEvents / dispatchWorkerErrorEvent`

Lower-level helpers that register native event listeners on an `EventTarget` and forward translated `WorkerEvent`s to an `IEventDispatcher`. Each returns a `() => void` cleanup function.

```typescript
import { dispatchWorkerErrorEvent } from '@actualwave/worker-dispatcher/WorkerEvent';

const cleanup = dispatchWorkerErrorEvent(target, myDispatcher.receiver);
// later:
cleanup();
```

## TypeScript types

```typescript
import type { WorkerTypeValue } from '@actualwave/worker-dispatcher/WorkerType';
import type { NativeEventHandler } from '@actualwave/worker-dispatcher/WorkerEvent';
import type { WorkerLike } from '@actualwave/worker-dispatcher/AbstractDispatcher';

import type {
  EventObject,
  IEventDispatcher,
  EventProcessor,
  EventListener,
} from '@actualwave/event-dispatcher';
```

## Common edge cases

- **Service Worker recovery**: `ServiceWorkerDispatcher` automatically recreates the `MessageChannel` and retransmits pending `port2` when the active worker changes. The first `dispatchEvent()` after construction always transfers `port2`.
- **`destroy()` on server dispatchers**: Call `destroy()` when tearing down a `SharedServerDispatcher` or `ServiceServerDispatcher` to remove all native `addEventListener` registrations from `self`.
- **`start()` on `SharedWorkerDispatcher`**: `start()` is called automatically in the constructor; calling it again is a no-op in most environments but safe.
- **`WorkerEvent.MESSAGEERROR` value**: The correct value is `'worker:messageerror'`, not `'messageerror'`. Use the constant, not the string literal.
- **`createForSelf()` auto-detection**: Checks `typeof self.postMessage === 'function'` (Dedicated Worker) then checks `self.registration.scope` (Service Worker), then falls back to `SharedServerDispatcher`.
- **Preprocessors apply on both sides**: Pass the same preprocessor to receiver and sender if you want symmetric transformation; they are independent by default.
