---
name: messageport-dispatcher
description: How to use @actualwave/messageport-dispatcher — cross-origin event communication via MessagePort. Use when adding typed named-event messaging between iframes, Web Workers, or any window-like target; when replacing raw postMessage/message-event boilerplate with named events; or when working in a project that imports from this package.
license: MIT
metadata:
  package: "@actualwave/messageport-dispatcher"
  version: "1.1.7"
  repository: https://github.com/burdiuz/js-messageport-event-dispatcher
---

# @actualwave/messageport-dispatcher

Cross-origin EventDispatcher built on the [MessagePort API](https://developer.mozilla.org/en-US/docs/Web/API/MessagePort). Replaces raw `postMessage` / `message` event boilerplate with typed named events on both sides of a communication channel. Internally it uses two `@actualwave/event-dispatcher` instances — one for incoming (`receiver`) and one for outgoing (`sender`) events.

## Installation

```bash
npm install @actualwave/messageport-dispatcher
# or
yarn add @actualwave/messageport-dispatcher
```

## Core concepts

- `MessagePortDispatcher` — main class. Wraps a target (`Window`, `Worker`, or any `MessagePort`-like object).
- `receiver` — `IEventDispatcher` that fires incoming events from the other side. The public `addEventListener` / `removeEventListener` methods delegate here.
- `sender` — `IEventDispatcher` that fires when YOU send an event (the echo). Listen here to observe your own outgoing traffic locally.
- `dispatcherId` — unique ID stamped on every outgoing packet. When a message echoes back on the same channel the dispatcher routes it to `sender`, not `receiver`, preventing false local dispatch.
- `targetOrigin` — passed to `postMessage`. Defaults to `'*'`. Set to a specific origin in production.

## Usage patterns

### 1. Iframe — outer document

```typescript
import { MessagePortDispatcher } from '@actualwave/messageport-dispatcher';

const dispatcher = new MessagePortDispatcher(iframeElement.contentWindow);

dispatcher.addEventListener('ready', (event) => {
  console.log('iframe is ready', event.data);
});

dispatcher.dispatchEvent('init', { config: { theme: 'dark' } });
```

### 2. Iframe — inside the iframe

```typescript
import { getForParent } from '@actualwave/messageport-dispatcher';

const dispatcher = getForParent(); // cached singleton for parent window

dispatcher.dispatchEvent('ready', { version: '1.0' });

dispatcher.addEventListener('init', (event) => {
  applyConfig((event.data as any).config);
});
```

`getForSelf()`, `getForParent()`, and `getForTop()` return cached singletons — always the same instance per execution context.

### 3. Web Worker

Main thread:
```typescript
import { MessagePortDispatcher } from '@actualwave/messageport-dispatcher';

const worker = new Worker('./worker.js');
const dispatcher = new MessagePortDispatcher(worker);

dispatcher.addEventListener('result', (event) => console.log(event.data));
dispatcher.dispatchEvent('compute', { input: [1, 2, 3] });
```

Inside the worker:
```typescript
import { getForSelf } from '@actualwave/messageport-dispatcher';

const dispatcher = getForSelf();

dispatcher.addEventListener('compute', (event) => {
  dispatcher.dispatchEvent('result', process((event.data as any).input));
});
```

### 4. Custom transport adapter

Any object with `postMessage`, `addEventListener`, and `removeEventListener` works:

```typescript
const target = {
  postMessage: (data: unknown, origin: string) => myTransport.send(data),
  addEventListener: (type: string, handler: (e: any) => void) => myTransport.on(type, handler),
  removeEventListener: (type: string, handler: (e: any) => void) => myTransport.off(type, handler),
};
const dispatcher = new MessagePortDispatcher(target);
```

### 5. MessagePortTarget — split sender / receiver

Use when sending and receiving go through different objects. Typical for same-page iframe setups where you send to `iframe.contentWindow` but receive on `window`:

```typescript
import { MessagePortDispatcher, MessagePortTarget } from '@actualwave/messageport-dispatcher';

const target = new MessagePortTarget(iframeElement.contentWindow, window);
const dispatcher = new MessagePortDispatcher(target);
```

Arrays are accepted for broadcasting to or receiving from multiple targets:

```typescript
const target = new MessagePortTarget(
  [iframe1.contentWindow, iframe2.contentWindow], // senders
  window,                                          // single receiver
);
```

## Sender vs receiver — which to use

```typescript
// Receiving
dispatcher.addEventListener('event', handler);          // fires for events FROM the other side
dispatcher.receiver.addEventListener('event', handler); // identical to the line above

// Observing outgoing
dispatcher.sender.addEventListener('event', handler);   // fires when YOU call dispatchEvent

// Sending
dispatcher.dispatchEvent('event', data);                // serialises and sends via postMessage
dispatcher.sender.dispatchEvent('event', data);         // fires locally ONLY — does NOT transmit
```

## Event preprocessors

Transform every event before it reaches listeners (receiver) or before it is sent (sender):

```typescript
import type { EventProcessor } from '@actualwave/event-dispatcher';

const addTimestamp: EventProcessor = (event) => ({
  ...event,
  data: { ...(event.data as object), ts: Date.now() },
});

const dispatcher = new MessagePortDispatcher(
  target,
  null,           // customPostMessageHandler
  addTimestamp,   // receiverEventPreprocessor — applied to incoming events
  addTimestamp,   // senderEventPreprocessor  — applied before postMessage
);
```

## Custom postMessage handler

Replace the default `target.postMessage()` call entirely:

```typescript
const dispatcher = new MessagePortDispatcher(
  target,
  function (data, targetOrigin, transferList) {
    console.log('Sending', data);
    this.target.postMessage(data, targetOrigin, transferList);
  },
);
```

## API reference

### `MessagePortDispatcher` constructor

| Parameter | Type | Default | Description |
|---|---|---|---|
| `target` | `MessagePortLike \| null` | `self` | Object with `postMessage` and `addEventListener`. |
| `customPostMessageHandler` | `Function \| null` | `null` | Replaces default `target.postMessage()`. Receives `(data, targetOrigin, transferList?)`. |
| `receiverEventPreprocessor` | `EventProcessor \| null` | `null` | Transforms incoming events before listeners fire. |
| `senderEventPreprocessor` | `EventProcessor \| null` | `null` | Transforms outgoing events before `postMessage`. |

### Instance members

| Member | Type | Description |
|---|---|---|
| `dispatcherId` | `string` | Unique ID stamped on every outgoing packet. |
| `targetOrigin` | `string` | Passed to `postMessage`. Default `'*'`. |
| `target` | `MessagePortLike` | The underlying port object. |
| `customPostMessageHandler` | `PostMessageHandler \| null` | The custom handler passed to the constructor, if any. |
| `senderEventPreprocessor` | `EventProcessor \| null` | The outgoing event preprocessor passed to the constructor, if any. |
| `sender` | `IEventDispatcher` | Fires for outgoing echoes. |
| `receiver` | `IEventDispatcher` | Fires for incoming events. |
| `addEventListener(type, listener, priority?)` | `void` | Adds listener to `receiver`. |
| `hasEventListener(type)` | `boolean` | Checks `receiver`. |
| `removeEventListener(type, listener)` | `void` | Removes from `receiver`. |
| `removeAllEventListeners(type)` | `void` | Clears all `receiver` listeners for a type. |
| `dispatchEvent(eventType, data?, transferList?)` | `void` | Serialises and sends via `postMessage`. |

### Factory functions

| Function | Description |
|---|---|
| `createMessagePortDispatcher(target?, ...)` | Creates a new `MessagePortDispatcher`. Same signature as constructor. |
| `getForSelf()` | Cached singleton for `self`. |
| `getForParent()` | Cached singleton for `parent`. |
| `getForTop()` | Cached singleton for `top`. |

### `MessagePortTarget`

```typescript
new MessagePortTarget(
  sender?: PostMessageTarget | PostMessageTarget[] | null,
  receiver?: EventListenerTarget | EventListenerTarget[] | null,
)
```

`PostMessageTarget` needs `postMessage(...args)`. `EventListenerTarget` needs `addEventListener` and `removeEventListener`.

## Data serialisation

Only serialisable data crosses the boundary. Before sending, the library inspects the event data value:

- **Has `toJSON()` method** → its return value is sent as-is (structured clone path). The developer is responsible for converting all nested objects.
- **No `toJSON()`** → `JSON.stringify` is applied, then parsed back on the receiving side.

```typescript
class MyPayload {
  constructor(public items: Item[]) {}
  toJSON() {
    return { items: this.items.map((i) => i.serialize()) };
  }
}

dispatcher.dispatchEvent('update', new MyPayload(items));
```

## Wire format and message parsing utilities

Every outgoing event is wrapped in a `MessagePortEvent` envelope before being passed to `postMessage`. The wire format is:

```
{ event: serialisedEventObject, dispatcherId: string }
```

Where `serialisedEventObject` is either the return value of `event.toJSON()` (if implemented) or `JSON.stringify(event)`.

Three utilities for working with this envelope are exported:

```typescript
import {
  MessagePortEvent,
  isMessagePortEvent,
  parseMessagePortEvent,
} from '@actualwave/messageport-dispatcher';
```

### `MessagePortEvent`

The envelope class used internally for every packet:

```typescript
class MessagePortEvent {
  event: unknown;        // the serialised EventObject
  dispatcherId: string;  // ID of the sending dispatcher

  constructor(event: unknown, dispatcherId: string);
  toJSON(): { event: unknown; dispatcherId: string };
}
```

### `isMessagePortEvent`

Type guard that checks whether a value has the `{ event, dispatcherId }` shape without parsing:

```typescript
isMessagePortEvent(object: unknown): object is { event: unknown; dispatcherId: string }
```

### `parseMessagePortEvent`

Parses a raw `postMessage` payload into a `MessagePortEvent`, or returns `null` if the value is not a valid envelope. Handles both JSON strings and structured-clone objects:

```typescript
parseMessagePortEvent(object: unknown): MessagePortEvent | null
```

This is most useful when you need to intercept raw `message` events and route them manually — for example, a server-side handler (Service Worker, SharedWorker) that must extract a `MessagePort` from the native event before forwarding to a per-client dispatcher:

```typescript
import { parseMessagePortEvent } from '@actualwave/messageport-dispatcher';
import type { EventObject } from '@actualwave/event-dispatcher';

self.addEventListener('message', (nativeEvent: MessageEvent) => {
  const message = parseMessagePortEvent(nativeEvent.data);
  if (!message) return;

  const { type, data } = message.event as EventObject;
  const clientPort = nativeEvent.ports[0]; // extract the transferred port
  // create a per-client dispatcher using clientPort, then dispatch the event
});
```

## TypeScript types

```typescript
import type {
  EventObject,      // { type: string; data?: unknown }
  DispatchedEvent,  // EventObject + stopPropagation + stopImmediatePropagation (during dispatch only)
  EventType,        // string | EventObject
  EventListener,    // (event: DispatchedEvent) => void
  EventProcessor,   // (event: EventObject) => EventObject
  IEventDispatcher, // interface with the 5 public methods
} from '@actualwave/event-dispatcher';

import type { MessagePortLike } from '@actualwave/messageport-dispatcher';
```

## Common edge cases

- **Echo suppression**: `window.postMessage` echoes messages back to the sender window. `MessagePortDispatcher` handles this automatically via `dispatcherId` — echoed events go to `sender`, never `receiver`.
- **Same-side dispatch**: `dispatcher.dispatchEvent('e')` does NOT fire on the same dispatcher's `addEventListener`. Use `MessagePortTarget` with the same window on both sides if loopback is needed.
- **`targetOrigin` in production**: Default is `'*'`. For cross-origin iframes carrying sensitive data, set `dispatcher.targetOrigin = 'https://trusted-origin.com'` before dispatching.
- **Singleton factories**: `getForSelf()`, `getForParent()`, `getForTop()` are cached per module. They cannot be reset — create a `new MessagePortDispatcher()` directly if you need multiple instances for the same global target.
- **Worker lifecycle**: The worker must set up its own `MessagePortDispatcher` (or call `getForSelf()`) before the main thread sends the first event.
- **`toJSON` responsibility**: When `toJSON()` is present, the library passes its return value through without further processing. Nested objects are your responsibility.
- **Non-serialisable values**: Functions, class instances without `toJSON`, `Map`, `Set`, `undefined`, and circular references will throw or silently lose data during `JSON.stringify`. Use plain objects or implement `toJSON`.
- **React Native**: `_postMessageListener` checks `event.nativeEvent ?? event` before parsing. This makes `MessagePortDispatcher` compatible with React Native WebViews, which wrap the native event inside a `.nativeEvent` property, without any extra configuration.
