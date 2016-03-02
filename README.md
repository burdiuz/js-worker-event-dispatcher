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
Within Worker it can be created via `WorkerEventDispatcher.self()`, don't need to pass anything, it grabs Worker's global scope object to communicate.
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
Within SharedWorker it can be created via `WorkerEventDispatcher.self()`. WorkerEventDispatcher's for clients will be created automatically.
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

## API


### Links
[https://www.w3.org/TR/workers/](https://www.w3.org/TR/workers/)
