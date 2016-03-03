# WorkerEventDispatcher

[![Build Status](https://travis-ci.org/burdiuz/js-worker-event-dispatcher.svg?branch=master)](https://travis-ci.org/burdiuz/js-worker-event-dispatcher)
[![Coverage Status](https://coveralls.io/repos/github/burdiuz/js-worker-event-dispatcher/badge.svg?branch=master)](https://coveralls.io/github/burdiuz/js-worker-event-dispatcher?branch=master)  
  
This is extension of [MessagePortDispatcher](https://github.com/burdiuz/js-messageport-event-dispatcher) to work with Dedicated and Shared Workers. It makes possible two-way communication with Workers using custom events. So, instead of using `postMessage()` and catching `message` event all the time, you are free to send any type of events to and from worker.

## Installation
WorkerEventDispatcher is available via [bower](http://bower.io/)
```
bower install worker-event-dispatcher --save
```
If you want to use it with [npm](https://www.npmjs.com/) package manger, add it to `dependencies`section of your package.json file.
```javascript
"dependencies": {
  "worker-event-dispatcher": "git://github.com/burdiuz/js-worker-event-dispatcher.git"
}
```
Also WorkerEventDispatcher has standalone distribution file that includes all dependencies, so you can just [download single file](https://github.com/burdiuz/js-worker-event-dispatcher/blob/master/dist/worker-event-dispatcher.standalone.min.js) with everything needed to start using it.

## Usage
WorkerEventDispatcher should be used on HTML page and in Worker script to properly handle communication.

#### Dedicated Worker
WorkerEventDispatcher for Dedicated Worker can be created via operator `new`
```javascript
var worker = new Worker('/workers/worker.js');
var dispatcher = new WorkerEventDispatcher(worker);
```
or `WorkerEventDispatcher.create()` factory method
```javascript
var worker = new Worker('/workers/worker.js');
var dispatcher = WorkerEventDispatcher.create(worker);
/* or you can specify worker type */
var dispatcher = WorkerEventDispatcher.create(worker, WorkerEventDispatcher.DEDICATED_WORKER);
```
Within Worker script it can be created via `WorkerEventDispatcher.self()`, don't need to pass anything, it grabs Worker's global scope object to communicate.
```javascript 
var dispatcher = WorkerEventDispatcher.self();
```
WorkerEventDispatcher accepts Worker objects or string URL to JS file that should be launched in worker.
Here Worker will be created from passed URL string:
```javascript
var dispatcher = new WorkerEventDispatcher('/workers/worker.js');
```

#### Shared Worker
To use WorkerEventDispatcher with Shared Worker, it should be created via `WorkerEventDispatcher.create()` factory method with specified Worker type.
```javascript
 var worker = new SharedWorker('/workers/sharedworker.js');
 var dispatcher = WorkerEventDispatcher.create(worker, WorkerEventDispatcher.SHARED_WORKER);
 dispatcher.start();
```
Within SharedWorker it can be created via `WorkerEventDispatcher.self()`. WorkerEventDispatcher's for client connections will be created automatically.
```javascript
var dispatcher = WorkerEventDispatcher.self();
dispatcher.addEventListener(WorkerEventDispatcher.WorkerEvent.CONNECT, function(event) {
  var client = event.client;
  client.addEventListener('data', function(event) {
    console.log('new data from client', event.data);
  });
  client.start();
  client.dispatchEvent('initialized');
});
```

#### Sending and receiving messages
To send messages use `dispatchEvent()` event and to receive messages add event listeners. Sent events will not be fired for sender dispatcher, so you cannot listen for event you just sent
```javascript 
var dispatcher = new WorkerEventDispatcher('/workers/worker.js');
dispatcher.addEventListener('anyEvent', function(){
	console.log('Event received');
});
dispatcher.dispatchEvent('anyEvent');
```
In this case event listener will not be called, but if other side will send `"anyEvent"` event, this listener will be called.
On HTML page:
```javascript
var dispatcher = new WorkerEventDispatcher('/workers/worker.js');
dispatcher.addEventListener('anyEvent', function(event) {
	console.log('Event received');
});
```
Worker code:
```javascript
var dispatcher = WorkerEventDispatcher.self();
dispatcher.dispatchEvent('anyEvent');
```

Project contains `example` folder with examples for Dedicated and Shared workers communication built with WorkerEventDispatcher.

## API
#### WorkerEventDispatcher constructor arguments
 - **worker**:Worker|MessagePort|String - Worker instance or URL string for worker script.
 - **receiverEventPreprocessor**:Function - Optional, allows pre-processing of events and their data before firing event.
 - **senderEventPreprocessor**:Function - Optional, allows pre-processing of events and their data before passing them to `postMessage`.
 - *type?:String - argument used internally to generate type property in prototype.*

#### WorkerEventDispatcher shared instance members
WorkerEventDispatcher is a base class and it shares functionality across all types of WorkerEventDispatcher's. When WorkerEventDispatcher instantiated directly, it actually creates DedicatedWorkerEventDispatcher.

 - **type**:String  - type of the worker  
Including [all members of MessagePortDispatcher](https://github.com/burdiuz/js-messageport-event-dispatcher/blob/master/README.md#messageportdispatcher-instance-members), some most important:
 - **addEventListener**(eventType:String, listener:Function):void - add listener for incoming events. This method copied from `receiver`.
 - **hasEventListener**(eventType:String):Boolean - check if incoming event has listeners. This method copied from `receiver`.
 - **removeEventListener**(eventType:String, listener:Function):void - remove event listener for incoming event. This method copied from `receiver`.
 - **dispatchEvent**(event:Object):void - does not fire event, it sends event to `postMessage()`. Can be used with two arguments:
  - dispatchEvent(eventType:String, data?:Object):void

#### WorkerEventDispatcher static members

 - **CONNECT_EVENT**:String - Short of `WorkerEvent.CONNECT`. Event fired in Shared Worker script when new client is available.
 - **DEDICATED_WORKER**:String - Short of `WorkerType.DEDICATED_WORKER`
 - **SHARED_WORKER**:String - Short of `WorkerType.SHARED_WORKER`
 - **create**(target:String|Worker|SharedWorker, type?:String, receiverEventPreprocessor?:Function, senderEventPreprocessor?:Function):WorkerEventDispatcher - Creates WorkerEventDispatcher instance based on type. Currently supported types are `WorkerEventDispatcher.DEDICATED_WORKER` and `WorkerEventDispatcher.SHARED_WORKER`. By default will create dispatcher for Dedicated Worker.
 - **self**(receiverEventPreprocessor?:Function, senderEventPreprocessor?:Function):WorkerEventDispatcher - Can be used in Worker script, it checks what kind of worker is used and returns proper dispatcher object for WorkerGlobalScope. For Dedicated Worker returns instance of DedicatedWorkerEventDispatcher and for Shared Worker -- ServerEventDispatcher.

 - WorkerEvent:Object - Worker event types 
   - CONNECT:String - Mirroring connect event fired from WorkerGlobalScope, fired when new client connected. Event object contains field `client` with `ClientEventDispatcher` instance, to communicate with client.
   - ERROR:String - Mirroring [error event](https://developer.mozilla.org/en-US/docs/Web/Events/error) fired from WorkerGlobalScope
   - LANGUAGECHANGE:String -  Mirroring [languagechange event](https://developer.mozilla.org/en-US/docs/Web/Events/languagechange) fired from WorkerGlobalScope
   - ONLINE:String - Mirroring [online event](https://developer.mozilla.org/en-US/docs/Web/Events/online) fired from WorkerGlobalScope 
   - OFFLINE:String - Mirroring [offline event](https://developer.mozilla.org/en-US/docs/Web/Events/offline) fired from WorkerGlobalScope
 - WorkerType:Object - Possible dispatcher types, used with `WorkerEventDispatcher.create()`
   - DEDICATED_WORKER:String - Default type, will create DedicatedWorkerEventDispatcher
   - SHARED_WORKER:String - Will create SharedWorkerEventDispatcher
   - SHARED_WORKER_SERVER:String - For internal usage, will create ServerEventDispatcher
   - SHARED_WORKER_CLIENT:String - For internal usage, will create ClientEventDispatcher
 - DedicatedWorker:Function - Constructor of DedicatedWorkerEventDispatcher
 - SharedWorker:Function - Constructor of SharedWorkerEventDispatcher 
 - Server:Function - Constructor of ServerEventDispatcher
 - Client:Function - Constructor of ClientEventDispatcher


#### DedicatedWorkerEventDispatcher
Created when `WorkerEventDispatcher.DEDICATED_WORKER` used, when `WorkerEventDispatcher.self()` called in Dedicated Worker or when WorkerEventDispatcher called with `new` operator.

 - **terminate**():void - close connection to worker, i.e. destroy worker.

#### SharedWorkerEventDispatcher
Created when WorkerEventDispatcher.SHARED_WORKER used. When created using `WorkerEventDispatcher.create()`, worker's name will default to `null`, if you need to specify name, you can instantiate it with constructor.
```javascript
var dispatcher = new WorkerEventDispatcher.SharedWorkerEventDispatcher('/workers/sharedworker.js', 'worker-name');
``` 

#### ServerEventDispatcher
Created when WorkerEventDispatcher.self() called in Shared Worker. It differs from other types of WorkerEventDispatcher's because **does not have `dispatchEvent()` method**, so it can only listen for events, like WorkerEvent.CONNECT to accept connections. Since it cannot send data, it does not have `sender` EventDispatcher either, only `receiver` available.

#### ClientEventDispatcher
Created when Shared Worker gets new connection. to capture new connections, you shuld listen to WorkerEvent.CONNECT event.

 - **start**():void - Start communication with client
 - **close**():void - Close connection to client

```javascript
var _clients = [];
// Create ServerEventDispatcher
var dispatcher = WorkerEventDispatcher.self();
// Listen to incoming connections
dispatcher.addEventListener(WorkerEventDispatcher.WorkerEvent.CONNECT, function(event) {
  // Get ClientEventDispatcher of new connection from event, save and start it
  var client = event.client;
  _clients.push(client);
  client.start();
  client.dispatchEvent('initialize');
});
```
  
### Links
[MDN - Using web workers](https://developer.mozilla.org/ru/docs/DOM/Using_web_workers)
[https://www.w3.org/TR/workers/](https://www.w3.org/TR/workers/)
