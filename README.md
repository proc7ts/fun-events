Functional Event Processor
==========================

[![NPM][npm-image]][npm-url]
[![CircleCI][ci-image]][ci-url]
[![codecov][codecov-image]][codecov-url]

The API implements a simple protocol for registering event receivers in event senders for event receiving:

```typescript
import { EventIterest, OnEvent } from 'fun-events';

// API supports arbitrary event receiver signatures
// An event is a tuple of event receiver arguments
function eventReceiver(type: string, event: Event) { 
  console.log('Event of type ', type, event);
}

// An `OnEvent` registrar function accepts event receivers with event interface 
const onEvent: OnEvent<[string, Event]>;

// Call an `OnEvent` registrar to register receiver
// An event interest returned can be used to unregister
const interest: EventIterest = onEvent(eventReceiver);

// Generate some events

interest.off(); // The eventReceiver will no longer receive events after this call
```


[npm-image]: https://img.shields.io/npm/v/fun-events.svg
[npm-url]: https://www.npmjs.com/package/fun-events
[ci-image]:https://circleci.com/gh/surol/fun-events.svg?style=shield
[ci-url]:https://circleci.com/gh/surol/fun-events  
[codecov-image]: https://codecov.io/gh/surol/fun-events/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/surol/fun-events


`EventReceiver`
---------------

Event receiver is a function that is called on each event sent by event sender when registered.

To register an event receiver in event receiver just call the registration function with this receiver as argument.


### Recurrent Events

A _recurrent event_ is an event sent from inside event receiver and targeted the same receiver. Recurrent event
processing is scheduled until after the current event processing finishes. To handle recurrent events in a specific
way the event receiver may utilize an event processing context available as `this` parameter.

This context has an `afterRecurrent()` method. It schedules the given event receiver to be called to process recurrent
event(s). If this method is called during event processing, the recurrent events will be sent to the given `receiver`
after current event processed instead of original one:

The event receiver then can look like this:
```typescript
import { EventReceiver } from 'fun-events';

// API supports arbitrary event receiver signatures
// An event is a tuple of event receiver arguments
function eventReceiver(this: EventReceiver.Context<[string, Event]>, type: string, event: Event) { 
  console.log('Event of type ', type, event);
  // Event processing potentially leading to sending event to this receiver again
  this.afterRecurrent((recurrentType, recurrentEvent) => {
    console.log('Recurrent event of type ', type, event);
  });
}
``` 


`EventSender`
-------------

An event sender interface has only one method accepting an event receiver to register. Once this method called, the
receiver will start receiving the events while still interested.

The event receiver registrar method is typically implements an `OnEvent` interface - a function augmented with handy
methods. To convert a plain event receiver registration function to `OnEvent` an `onEventBy()` function can be used.


### `OnEvent.once()`

Registers the next event receiver. It won't receive any events after receiving the first one.


`EventIterest`
--------------

An interest for receiving the events.

This is what returned when registering an event receiver.

Once the receiver is no longer interested in receiving events, an `off()` method should be called to indicate the
lost of interest in receiving events.

By convenience, `EventInterest` instances should be constructed using `eventInterest()` function.


`EventEmitter`
--------------

Event emitter is a handy implementation of `OnEvent` registrar along with methods for sending events.

Manages a list of registered event receivers, and removes them from the list once they lose their interest
(i.e. the `off()` is called on the returned event interest instance).

Can be used as `EventSender`.

```typescript
import { EventEmitter } from 'fun-events';

const emitter = new EventEmitter<[string]>();

// Register receivers
emitter.on(event => `${event}-`);
emitter.on(event => `-${event}`);

// Send an event
emitter.send('listen');
```


State Tracking
--------------

A state is a tree-like structure of sub-states (nodes) available under `StatePath`.

A `StateTracker` can be used to notify on state changes of particular nodes. Then the registered receivers will receive
an update.

```typescript
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


Value Tracking
--------------

A `ValueTracker` class represents an accessor to some value which changes can be tracked.

A simple `ValueTracker` can be constructed using a `trackValue()` function:

```typescript
import { trackValue } from 'fun-events';

const value = trackValue(1);

value.on((newValue, oldValue) => console.log('Value changed from', oldValue, 'to', newValue));

console.log(value.it); // 1
value.it = 2; // Value changed from 1 to 2
console.log(value.it); // 2 
```

It is also possible to bind one value to another:
```typescript
import { trackValue } from 'fun-events';

const value1 = trackValue(1);
const value2 = trackValue(0).by(value1);

console.log(value2.it); // 1
value1.it = 2;
console.log(value2.it); // 2
```

To synchronize multiple values with each other a `ValueSync` can be used:
```typescript
import { trackValue, ValueSync } from 'fun-events';

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


DOM Events
----------

DOM events are supported by `OnDomEvent` and `DomEventDispatcher`. The former extends an `OnEvent` event receiver
registrar interface with DOM-specific functionality. The latter can be attached to arbitrary `EventTarget`. It provides
a `OnDomEvent` registrars for each event type and dispatches DOM events.

```typescript
import { DomEventDispatcher } from 'fun-events';

const dispatcher = new DomEventDispatcher(document.getElementById('my-button'));

dispatcher.on('click')(submit);
dispatcher.dispatch(new KeyboardEvent('click'));
```

### `OnDomEvent`

A DOM event listener registration function interface. It extends `OnEvent` interface with the following properties:


#### `capture`

A DOM event listener registrar derived from this one that enables event capturing by default.

This corresponds to specifying `true` or `{ capture: true }` as a second argument to `EventTarget.addEventListener()`.

```typescript
import { DomEventDispatcher } from 'fun-events';

const container = document.getElementById('my-container');

// Clicking on the inner elements would be handled by container first.
new DomEventDispatcher(container).on('click').capture(handleContainerClick);

// The above is the same as
container.addEventListener('click', handleContainerClick, true);
```


#### `instead`

A DOM event listener registrar derived from this one that registers listeners to invoke instead of default action.

It invokes an `Event.preventDefault()` method prior to calling the registered listeners. 

```typescript
import { DomEventDispatcher } from 'fun-events';

// Clicking on the link won't lead to navigation.
new DomEventDispatcher(document.getElementById('my-href')).on('click').instead(doSomethingElse); 
```


#### `just`

A DOM event listener registrar derived from this one that registers listeners preventing further propagation of
current event in the capturing and bubbling phases.

It invokes an `Event.stopPropagation()` method prior to calling the registered listeners.

```typescript
import { DomEventDispatcher } from 'fun-events';

// The ascendants won't receive a click the div.
new DomEventDispatcher(document.getElementById('my-div')).on('click').just(handleClick); 
```


#### `last`

A DOM event listener registrar derived from this one that registers the last event listener.

It invokes an `Event.stopImmediatePropagation()` method prior to calling the registered listeners.

```typescript
import { DomEventDispatcher } from 'fun-events';

const dispatcher = new DomEventDispatcher(document.getElementById('my-div'))
const onClick = dispatcher.on('click');

// The ascendants won't receive a click the div.
onClick.last(() => console.log('1')); // This is the last handler 
onClick(() => console.log('2'));      // This one won't be called

dispatcher.dispatch(new KeyboardEvent('click')); // console: 1 
```


#### `passive`

A DOM event listener registrar derived from this one that accepts listeners never calling `Event.preventDefault()`.

This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.

```typescript
import { DomEventDispatcher } from 'fun-events';

// Scrolling events won't be prevented.
new DomEventDispatcher(document.body).on('scroll').passive(handleScroll);

// The above is the same as
document.body.addEventListener('scroll', handleScroll, { passive: true });
```
