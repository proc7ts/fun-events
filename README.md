Functional Event Processor
==========================

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![codecov][codecov-image]][codecov-url]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

A simple protocol for sending events to receivers registered in senders:

```typescript
import { OnEvent } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';

// API supports arbitrary event receiver signatures.
// An event is a receiver's parameters.
function eventReceiver(type: string, event: Event) { 
  console.log('Event of type ', type, event);
}

// An `OnEvent` event sender accepts event receivers with compatible event signature 
const onEvent: OnEvent<[string, Event]>;

// An `OnEvent` sender is a function that registers a receiver.
// An event supply returned can be cut off to unregister the receiver.
const supply: Supply = onEvent(eventReceiver);

// ...generate some events...

supply.off(); // The `eventReceiver` will no longer receive events after this call.
```


[npm-image]: https://img.shields.io/npm/v/@proc7ts/fun-events.svg?logo=npm
[npm-url]: https://www.npmjs.com/package/@proc7ts/fun-events
[build-status-img]: https://github.com/proc7ts/fun-events/workflows/Build/badge.svg
[build-status-link]: https://github.com/proc7ts/fun-events/actions?query=workflow%3ABuild
[codecov-image]: https://codecov.io/gh/proc7ts/fun-events/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/proc7ts/fun-events
[github-image]: https://img.shields.io/static/v1?logo=github&label=GitHub&message=project&color=informational
[github-url]: https://github.com/proc7ts/fun-events
[api-docs-image]: https://img.shields.io/static/v1?logo=typescript&label=API&message=docs&color=informational
[api-docs-url]: https://proc7ts.github.io/fun-events/


`EventReceiver`
---------------

An event receiver is a function that is called on each event sent by event supplier when registered.

To register an event receiver in event supplier just call the supplier function with this receiver as argument.

An event receiver can also be in object form:
```typescript
import { EventReceiver, OnEvent } from '@proc7ts/fun-events';
import { Supply } from '@proc7ts/primitives';

// API supports arbitrary event receiver signatures.
// An event is a receiver's `receive` method parameters following revent processing context.
const eventReceiver: EventReceiver<[string, Event]> = {
  receive(context, type, event) {
    console.log('Event of type ', type, event);
  }
};

// An `OnEvent` event sender accepts event receivers with compatible event signature 
const onEvent: OnEvent<[string, Event]>;

// An `OnEvent` sender is a function that registers a receiver.
// An event supply returned can be cut off to unregister the receiver.
const supply: EventSupply = onEvent.to(eventReceiver);

// ...generate some events...

supply.off(); // The `eventReceiver` will no longer receive events after this call.
```
In this form the event receiver's `receive` method accepts _event processing context_ as the first parameter.


### Recurrent Events

A _recurrent event_ is an event sent from inside event receiver and targeted the same receiver. Recurrent event
processing is scheduled until after the current event processing finishes. To handle recurrent events in a specific
way the event receiver may utilize an _event processing context_ available as first parameter of event receiver's
`receive` method.

This context has an `onRecurrent()` method. It schedules the given event receiver function to be called to process
recurrent events. If this method is called during event processing, the recurrent events will be sent to the given
`receiver` after current event processed instead of original one:

The event receiver then can look like this:
```typescript
import { EventReceiver } from '@proc7ts/fun-events';

// API supports arbitrary event receiver signatures
// An event is a tuple of event receiver arguments
const eventReceiver: EventReceiver<[string, Event]> = {
  receive(context, type, event) { 
    console.log('Event of type ', type, event);
    context.onRecurrent((recurrentType, recurrentEvent) => {
      console.log('Recurrent event of type ', recurrentType, recurrentEvent);
    });
    
    // ...event processing potentially leading to sending event to this receiver again...
    
  }
};
``` 


`EventSender`
-------------

An event sender interface has only one method returning an `OnEvent` instance. The latter can be used to register
an event receiver. The registered event receiver starts receiving upcoming events until the returned event supply
is cut off.

The `OnEvent` is a function implementing `EventSender` interface. It has additional event processing methods.
To convert a plain event receiver registration function to `OnEvent`, an `onEventBy()` function can be used.


### `OnEvent.do()`

[OnEvent.do()]: #oneventdo

Processes events with the given [event processors]. The first processor receives an `OnEvent` supplier instance as its
only parameter. The next one receives the result of the first processor, etc. The result of the last processor
is returned from the `.do()` method call.

This method is handy for chaining multiple processors.


`EventKeeper`
-------------

An event supplier that keeps the last event sent.

It has only one method that returns an `AfterEvent` instance. The latter can be used to register an event receiver.
The registered event receiver receives the kept event immediately upon registration, and all upcoming events after that
until the returned event supply is cut off.

The event keeper _always_ has an event to send, unless it is closed. This is handy when tracking some state: the
registered receiver receives current state, and all updates to it after that.

The `AfterEvent` is s function implementing `EventKeeper` interface. To convert a plain event receiver registration
function to `AfterEvent`, an `afterEventBy()` function can be used.


Event Supply
------------

A supply of events from event supplier to event receiver is returned from event receiver registration call.

When events are no longer needed (or just exhausted) the supply may be cut off by calling its `off()` method.

It also notifies on supply cut off by calling callback functions registered by its `whenOff()` method. 


Event Processors
----------------

[event processors]: #event-processors

Event processors are functions specifically designed to be passed to [OnEvent.do()] method. These are functions
that may transform event suppliers or their events.

The following event processors implemented:

- [consumeEvents] - Creates an event processor that consumes incoming events.
- [filterEvents] - Creates an event processor that passes incoming events matching the given condition only.
- [firstEvent] - A processor of the first incoming event only.
- [letInEvents] - Creates an event processor that passes incoming events until the required supply is cut off.
- [mapEvents] - Creates an event processor that converts incoming events with the given converter function.
- [resolveEvents] - A processor that asynchronously resolves incoming events and sends then in the order of their
  resolution.
- [resolveEventsInOrder] - A processor that asynchronously resolves incoming events and sends them in the order they
  are received.
- [shareEvents] - A processor of incoming events that shares events supply among all registered receivers.
- [translateAfter] - Creates an event processor that translates events incoming from `AfterEvent` keeper.
- [translateOn] - Creates an event processor that translates events incoming from `OnEvent` sender.
- [valueEvents] - Creates an event processor that sends the values of incoming events.

[consumeEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#consumeEvents
[filterEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#filterEvents
[letInEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#letInEvents
[mapEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#mapEvents
[onceEvent]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#onceEvent
[resolveEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#resolveEvents
[resolveEventsInOrder]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#resolveEventsInOrder
[shareEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#shareEvents
[translateAfter]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#translateAfter
[translateOn]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#translateOn
[valueEvents]: https://proc7ts.github.io/fun-events/modules/@proc7ts_fun-events.html#valueEvents


`EventEmitter`
--------------

Event emitter is a handy implementation of `EventSender`.

It manages a list of registered event receivers, and removes them from the list once their supplies are cut off.

```typescript
import { EventEmitter } from '@proc7ts/fun-events';

const emitter = new EventEmitter<[string]>();

// Register receivers
emitter.on(event => console.log(`${event}-`));
emitter.on(event => console.log(`-${event}`));

// Send an event
emitter.send('listen');
```
         

Value Tracking
--------------

A `ValueTracker` class represents an accessor to some value which changes can be tracked.

A simple `ValueTracker` can be constructed using a `trackValue()` function:

```typescript
import { trackValue } from '@proc7ts/fun-events';

const value = trackValue(1);

value.on((newValue, oldValue) => console.log('Value changed from', oldValue, 'to', newValue));

console.log(value.it); // 1
value.it = 2; // Value changed from 1 to 2
console.log(value.it); // 2 
```

It is also possible to bind one value to another:
```typescript
import { trackValue } from '@proc7ts/fun-events';

const value1 = trackValue(1);
const value2 = trackValue(0).by(value1);

console.log(value2.it); // 1
value1.it = 2;
console.log(value2.it); // 2
```

To synchronize multiple values with each other a `ValueSync` can be used:
```typescript
import { trackValue, ValueSync } from '@proc7ts/fun-events';

const v1 = trackValue(1);
const v2 = trackValue(2);
const v3 = trackValue(3);

const sync = new ValueSync(0);

sync.sync(v1);
sync.sync(v2);
sync.sync(v3);

console.log(sync.it, v1.it === v2.it, v2.it === v3.it, v3.it === sync.it); // 0 true true true

v2.it = 11;
console.log(sync.it, v1.it === v2.it, v2.it === v3.it, v3.it === sync.it); // 11 true true true

sync.it = 22;
console.log(sync.it, v1.it === v2.it, v2.it === v3.it, v3.it === sync.it); // 22 true true true
```


State Tracking
--------------

A state is a tree-like structure of sub-states (nodes) available under `StatePath`.

A `StateTracker` can be used to notify on state changes of particular node and its sub-tree.

```typescript
import { StatePath, StateTracker } from '@proc7ts/fun-events';

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
tracker.track('property1').to(property1Changed); // Will be notified on `property1` changes
tracker.track(['property2']).to(property2Changed); // The path can be long

tracker.update(['some', 'path'], 'new', 'old');
// State path changed: ['some', 'path'] 

tracker.update('property1', 'new', 'old');
// State path changed: ['property1']
// Property 1 changed from old to new

tracker.update('property2', 1, 2);
// State path changed: ['property1']
// Property 2 changed from 2 to 1
```
