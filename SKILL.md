---
name: worker-dispatcher
description: How to use @actualwave/worker-dispatcher — named-event communication for Dedicated Workers, Shared Workers, and Service Workers. Use when replacing raw postMessage/message boilerplate with typed named events across worker boundaries; when setting up two-way communication between a page and a Dedicated Worker; when handling multi-client Shared Worker connections; when communicating with a Service Worker from the main thread; or when a project imports from this package.
license: MIT
metadata:
  package: "@actualwave/worker-dispatcher"
  version: "1.3.1"
  repository: https://github.com/burdiuz/js-worker-event-dispatcher
---

# @actualwave/worker-dispatcher

Named-event layer on top of `@actualwave/messageport-dispatcher` that handles Dedicated Workers, Shared Workers, and Service Workers. Both sides of every channel use the same event API — no raw `postMessage`/`message` wiring needed.

## Core concepts

- **`DedicatedWorkerDispatcher`** — wraps a `Worker` on the main thread, or wraps `self` inside the worker script.
- **`SharedWorkerDispatcher`** — wraps a `SharedWorker` on the main thread; manages the internal `MessagePort`.
- **`ServiceWorkerDispatcher`** — wraps a `MessageChannel` to the active Service Worker; auto-recovers when the worker restarts.
- **`SharedServerDispatcher`** — used *inside* a Shared Worker script; fires `WorkerEvent.CONNECT` with a `SharedClientDispatcher` per connection.
- **`ServiceServerDispatcher`** — used *inside* a Service Worker script; fires lifecycle events and per-message events with a `ServiceClientDispatcher` per port.
- **`SharedClientDispatcher` / `ServiceClientDispatcher`** — one instance per connected client; supports `start()`, `close()`, and `dispatchEvent()`.
- **`WorkerEvent`** — extends `Event`; all worker events are prefixed `worker:` (e.g. `'worker:connect'`).
- **`WorkerType`** — string constants: `'dedicated'`, `'shared'`, `'service'`.
- All public `addEventListener` / `removeEventListener` / `dispatchEvent` methods delegate to an internal `receiver` (`IEventDispatcher`).

## Installation

```bash
npm install @actualwave/worker-dispatcher
# or
yarn add @actualwave/worker-dispatcher
```

## Usage patterns

### 1. Dedicated Worker — main thread

```typescript
import { DedicatedWorkerDispatcher } from '@actualwave/worker-dispatcher';

const dispatcher = new DedicatedWorkerDispatcher('/workers/worker.js');

dispatcher.addEventListener('result', (event) => {
  console.log('Worker result:', event.data);
});

dispatcher.dispatchEvent('compute', { input: [1, 2, 3] });
```

### 2. Dedicated Worker — inside the worker

```typescript
import { createForSelf } from '@actualwave/worker-dispatcher';

const dispatcher = createForSelf(); // returns DedicatedWorkerDispatcher

dispatcher.addEventListener('compute', (event) => {
  dispatcher.dispatchEvent('result', { output: (event.data as any).input });
});
```

`createForSelf()` auto-detects the worker context and returns the right dispatcher type.

### 3. Shared Worker — main thread

```typescript
import { SharedWorkerDispatcher } from '@actualwave/worker-dispatcher';

const dispatcher = new SharedWorkerDispatcher('/workers/shared.js');
// start() is called automatically

dispatcher.addEventListener('broadcast', (event) => {
  console.log(event.data);
});

dispatcher.dispatchEvent('subscribe', { topic: 'news' });

// close when done:
dispatcher.close();
```

### 4. Shared Worker — inside the worker

```typescript
import { createForSelf } from '@actualwave/worker-dispatcher';
import WorkerEvent from '@actualwave/worker-dispatcher/WorkerEvent';
// or: import { WorkerEvent } from '@actualwave/worker-dispatcher';

const server = createForSelf(); // returns SharedServerDispatcher

server.addEventListener(WorkerEvent.CONNECT, (event) => {
  const client = event.client; // SharedClientDispatcher
  client.start();

  client.addEventListener('subscribe', (e) => {
    client.dispatchEvent('broadcast', { message: 'Hello!' });
  });
});

// tear down when the worker is closing:
// server.destroy();
```

### 5. Service Worker — main thread

```typescript
import { ServiceWorkerDispatcher } from '@actualwave/worker-dispatcher';

const dispatcher = new ServiceWorkerDispatcher();

// wait for the SW to be active before sending
dispatcher.onReady(() => {
  dispatcher.dispatchEvent('init', { config: { offline: true } });
});

dispatcher.addEventListener('ack', (event) => {
  console.log('SW acknowledged:', event.data);
});

// close channel when unmounting:
// dispatcher.close();
```

### 6. Service Worker — inside the worker

```typescript
import { ServiceServerDispatcher } from '@actualwave/worker-dispatcher';
import WorkerEvent from '@actualwave/worker-dispatcher/WorkerEvent';

const server = new ServiceServerDispatcher(); // defaults to self

server.addEventListener('init', (event) => {
  const client = event.client; // ServiceClientDispatcher | null
  if (client) {
    client.dispatchEvent('ack', { ok: true });
    client.close();
  }
});

// Lifecycle events are registered automatically:
server.addEventListener(WorkerEvent.INSTALL, (e) => {
  (e.nativeEvent as ExtendableEvent).waitUntil(caches.open('v1'));
});

server.addEventListener(WorkerEvent.ACTIVATE, (e) => {
  (e.nativeEvent as ExtendableEvent).waitUntil(clients.claim());
});
```

### 7. Factory function `create()`

```typescript
import { create, WorkerType } from '@actualwave/worker-dispatcher';

const d = create(worker, WorkerType.DEDICATED_WORKER);
const s = create(sharedWorker, WorkerType.SHARED_WORKER);
// WorkerType.SERVICE_WORKER creates a ServiceWorkerDispatcher (no target needed)
const svc = create(undefined, WorkerType.SERVICE_WORKER);
```

### 8. Event preprocessors

```typescript
import type { EventProcessor } from '@actualwave/event-dispatcher';

const stamp: EventProcessor = (event) => ({
  ...event,
  data: { ...(event.data as object), ts: Date.now() },
});

const dispatcher = new DedicatedWorkerDispatcher(
  '/worker.js',
  stamp,  // receiverEventPreprocessor — applied to incoming events
  stamp,  // senderEventPreprocessor  — applied before postMessage
);
```

## API reference

### Shared dispatcher interface

All dispatchers (except server dispatchers) extend `MessagePortDispatcher` and expose:

| Member | Description |
|---|---|
| `addEventListener(type, listener, priority?)` | Add listener to `receiver` |
| `hasEventListener(type)` | Check `receiver` |
| `removeEventListener(type, listener)` | Remove from `receiver` |
| `removeAllEventListeners(type)` | Clear all `receiver` listeners for a type |
| `dispatchEvent(type, data?, transferList?)` | Send via `postMessage` |
| `receiver` | `IEventDispatcher` for incoming events |
| `sender` | `IEventDispatcher` for outgoing echo |
| `target` | Underlying worker/port object |
| `dispatcherId` | Unique packet stamp |

### `DedicatedWorkerDispatcher`

```typescript
new DedicatedWorkerDispatcher(worker?: Worker | string, receiverPreprocessor?, senderPreprocessor?)
```

- `terminate()` — terminates the Worker and removes event listeners.
- Pass a URL string to create the `Worker` internally.

### `SharedWorkerDispatcher`

```typescript
new SharedWorkerDispatcher(target: SharedWorker | string, name?, receiverPreprocessor?, senderPreprocessor?)
```

- `start()` — start the port (automatic).
- `close()` — close the port and remove error listeners.
- `.worker` — the underlying `SharedWorker`.

### `ServiceWorkerDispatcher`

```typescript
new ServiceWorkerDispatcher(receiverPreprocessor?, senderPreprocessor?)
```

- `start()` — start the internal channel port (automatic).
- `close()` — close the port and remove error listeners.
- `ready` — `Promise<ServiceWorkerRegistration>`
- `onReady(handler)` — returns `Promise<void>`.
- Auto-recreates the `MessageChannel` when the active worker changes.

### `SharedServerDispatcher` (inside Shared Worker)

```typescript
new SharedServerDispatcher(target = self, receiverPreprocessor?, clientReceiverPreprocessor?, clientSenderPreprocessor?)
```

- Fires `WorkerEvent.CONNECT`; event `.client` is a `SharedClientDispatcher`.
- Also registers `error`, `languagechange`, `online`, `offline` listeners.
- `destroy()` — removes all native listeners from `target`.
- Server dispatchers do NOT have a `dispatchEvent()` method to send broadcasts.

### `ServiceServerDispatcher` (inside Service Worker)

```typescript
new ServiceServerDispatcher(target = self, receiverPreprocessor?, clientReceiverPreprocessor?, clientSenderPreprocessor?)
```

- Registers `error`, `messageerror`, `install`, `activate`, `fetch`, `sync`, `push` listeners automatically.
- On each `message` event: parses the wire format and fires a `WorkerEvent`; event `.client` is a `ServiceClientDispatcher` if a port was transferred.
- `destroy()` — removes all native listeners from `target`.

### `SharedClientDispatcher` / `ServiceClientDispatcher`

Returned as `event.client` on connect/message events.

- `start()` — start the `MessagePort`.
- `close()` — close the `MessagePort`.
- Full dispatcher interface for two-way communication with that client.

### `WorkerEvent` static constants

| Constant | Value |
|---|---|
| `WorkerEvent.CONNECT` | `'worker:connect'` |
| `WorkerEvent.MESSAGE` | `'worker:message'` |
| `WorkerEvent.ERROR` | `'worker:error'` |
| `WorkerEvent.MESSAGEERROR` | `'worker:messageerror'` |
| `WorkerEvent.LANGUAGECHANGE` | `'worker:languagechange'` |
| `WorkerEvent.ONLINE` | `'worker:online'` |
| `WorkerEvent.OFFLINE` | `'worker:offline'` |
| `WorkerEvent.INSTALL` | `'worker:install'` |
| `WorkerEvent.ACTIVATE` | `'worker:activate'` |
| `WorkerEvent.FETCH` | `'worker:fetch'` |
| `WorkerEvent.SYNC` | `'worker:sync'` |
| `WorkerEvent.PUSH` | `'worker:push'` |

Instance properties: `.type`, `.data`, `.nativeEvent` (original DOM event), `.client` (dispatcher or `null`).

### `WorkerType` constants

`WorkerType.DEDICATED_WORKER = 'dedicated'` | `WorkerType.SHARED_WORKER = 'shared'` | `WorkerType.SERVICE_WORKER = 'service'`

## Common edge cases

- **Do not use string literals for event types** — use `WorkerEvent.CONNECT`, `WorkerEvent.INSTALL`, etc. The `MESSAGEERROR` value is `'worker:messageerror'`, not `'messageerror'`.
- **`dispatchEvent` is one-directional** — sending an event does not fire it locally. To observe outgoing events, listen on `dispatcher.sender`.
- **Server dispatchers have no `dispatchEvent`** — `SharedServerDispatcher` and `ServiceServerDispatcher` can only listen; broadcast through individual `client` dispatchers.
- **Service Worker channel recovery** — `ServiceWorkerDispatcher` detects when the active worker changes and creates a new `MessageChannel`, reattaching all existing listeners. The first `dispatchEvent` after a change transfers `port2` automatically.
- **Call `destroy()` when done** — `SharedServerDispatcher` and `ServiceServerDispatcher` register multiple listeners on `self`. Call `destroy()` during cleanup to avoid leaks.
- **`createForSelf()` auto-detection order**: (1) `typeof self.postMessage === 'function'` → `DedicatedWorkerDispatcher`; (2) `self.registration.scope` → `ServiceServerDispatcher`; (3) fallback → `SharedServerDispatcher`.
- **Shared Worker `start()`** — `SharedWorkerDispatcher` calls `start()` automatically; `SharedClientDispatcher` does not — you must call `client.start()` in the `CONNECT` handler.
- **`ServiceClientDispatcher.close()`** — close client ports when finished to avoid memory leaks in long-lived Service Workers.
