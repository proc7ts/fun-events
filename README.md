Functional event producer/consumer API
======================================

[![NPM][npm-image]][npm-url]
[![CircleCI][ci-image]][ci-url]
[![codecov][codecov-image]][codecov-url]

The API implements a simple protocol of registering event consumers in event producers for the latter to be able
to notify the former on events:

```TypeScript
import { EventIterest, EventProducer } from 'fun-events';

// API supports arbitrary event consumer signatures
// An event is a set of arguments passed to consumers
function eventConsumer(type: string, event: Event) { 
  console.log('Event of type ', type, event);
}

// Event producer accepts consumers with predefined interface 
const eventProducer: EventProducer<(type: string, event: Event) => void>; // Some event producer;

// Call event producer to register consumer
// An event interest returned can be used to unregister
const interest: EventIterest = eventProducer(eventConsumer);

// Generate some events

interest.off(); // The eventConsumer will no longer recive events.
```


[npm-image]: https://img.shields.io/npm/v/fun-events.svg
[npm-url]: https://www.npmjs.com/package/fun-events
[ci-image]:https://circleci.com/gh/surol/fun-events.svg?style=shield
[ci-url]:https://circleci.com/gh/surol/fun-events  
[codecov-image]: https://codecov.io/gh/surol/fun-events/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/surol/fun-events


`EventConsumer`
---------------

Event consumer is a function that is called to notify on each event produced by `EventProducer` when registered.

To register an event consumer in event producer just call the event producer with that event consumer as argument.


`EventProducer`
---------------

Event producer is a function accepting an event consumer as its only argument.

Once called, the consumer will be notified on events, while the consumer is interested in receiving them.

Note that event producer is a function, not a method.

An event producer also has a set of handy methods. More could be added at later time.

To convert a plain function into `EventProducer` an `EventProducer.of()` function can be used.


### `once()`

Registers an event consumer the will be notified on the next event at most once.


`EventIterest`
--------------

An interest for the events.

This is what returned returned from `EventProducer` when registering an event consumer.

Once the consumer is no longer interested in receiving events, an `off()` method should be called, indicated the
lost of interest.


State Tracking
--------------

A state is a tree-like structure of sub-states (nodes) available under `StatePath`.

A `StateTracker` can be used to notify on state changes of particular nodes. Then the registered state update consumers
will be notified on these changes.

```TypeScript
import { StatePath, StateTracker } from 'fun-events';

const tracker = new StateTracker();

function stateChanged(path: StatePath) {
  console.log('State path changed:', path);
}

function property1Changed(path: StatePath, newValue: string, oldValue: string) {
  console.log('Property 1 changed from', oldValue, 'to', newValue);  
}

function property2Changed(path: StatePath, newValue: number, oldValue: number) {
  console.log('Property 2 changed from', oldValue, 'to', newValue);  
}

tracker.onUpdate(stateChanged); // Will be notified on all changes
tracker.track('property1', property1Changed); // Will be notified on `property1` changes
tracker.track(['property2'], property2Changed); // The path can be long

tracker.update(['some', 'path'], 'new', 'old');
// State path changed: ['some', 'path'] 

tracker.update('property1', 'new', 'old');
// State path changed: ['property1']
// Property 1 changed from old to new

tracker.update('property2', 1, 2);
// State path changed: ['property1']
// Property 2 changed from 2 to 1
```
