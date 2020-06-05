Functional Event Processor
==========================

[![NPM][npm-image]][npm-url]
[![Build Status][build-status-img]][build-status-link]
[![codecov][codecov-image]][codecov-url]
[![GitHub Project][github-image]][github-url]
[![API Documentation][api-docs-image]][api-docs-url]

A simple protocol for sending events to receivers registered in senders:

```typescript
import { EventSupply, OnEvent } from '@proc7ts/fun-events';

// API supports arbitrary event receiver signatures
// An event is a tuple of event receiver arguments
function eventReceiver(type: string, event: Event) { 
  console.log('Event of type ', type, event);
}

// An `OnEvent` event sender accepts event receivers with compatible event signature 
const onEvent: OnEvent<[string, Event]>;

// Call an `OnEvent.to()` method to register receiver
// An event supply returned can be cut off to unregister the receiver
const supply: EventSupply = onEvent.to(eventReceiver);

// ...generate some events...

supply.off(); // The eventReceiver will no longer receive events after this call
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

Event receiver is a function that is called on each event sent by event supplier when registered.

To register an event receiver in event supplier just call its registration method with this receiver as argument.

An event receiver can also be in object form:
```typescript
import { EventReceiver, EventSupply, OnEvent } from '@proc7ts/fun-events';

// API supports arbitrary event receiver signatures
// An event is a tuple of event receiver arguments
const eventReceiver: EventReceiver<[string, Event]> = {
  receive(context, type, event) {
    console.log('Event of type ', type, event);
  }
};

// An `OnEvent` event sender accepts event receivers with compatible event signature 
const onEvent: OnEvent<[string, Event]>;

// Call an `OnEvent.to()` method to register receiver
// An event supply returned can be cut off to unregister the receiver
const supply: EventSupply = onEvent.to(eventReceiver);

// ...generate some events...

supply.off(); // The eventReceiver will no longer receive events after this call
```
In this form event receiver method accepts _event processing context_ as first parameter.


### Recurrent Events

A _recurrent event_ is an event sent from inside event receiver and targeted the same receiver. Recurrent event
processing is scheduled until after the current event processing finishes. To handle recurrent events in a specific
way the event receiver may utilize an _event processing context_ available as first parameter of event receiver method.

This context has an `onRecurrent()` method. It schedules the given event receiver function to be called to process
recurrent event(s). If this method is called during event processing, the recurrent events will be sent to the given
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

The `OnEvent` is an `EventSender` implementation itself. It has additional event processing methods. To convert a plain
event receiver registration function to `OnEvent`, an `onEventBy()` function can be used.


### `OnEvent.once()`

Registers the next event receiver. It won't receive any events after receiving the first one.


`EventKeeper`
-------------

An event supplier that keeps the last event sent.

It has only one method that returns an `AfterEvent` instance. The latter can be used to register an event receiver.
The registered event receiver receives the kept event immediately upon registration, and all upcoming events after that
until the returned event supply is cut off.

The event keeper _always_ has event to send, unless it is closed. This is handy when tracking some state: the registered
receiver receives current state, and all updates to it after that.

The `AfterEvent` is an `EventKeeper` implementation itself. It extends `OnEvent` with methods specific to event keeper.
To convert a plain event receiver registration function to `AfterEvent`, an `afterEventBy()` function can be used.


`EventSupply`
-------------

A supply of events from event supplier to event receiver. It is returned from event receiver registration.

When events are no longer needed (or just exhausted) the supply may be cut off by calling its `off()` method.

It also notifies on supply cut off by calling callback functions registered by its `whenOff()` method. 

An event supply may be constructed using `eventSupply()` function.


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


DOM Events
----------

DOM events are supported by `OnDomEvent` and `DomEventDispatcher`. The former extends an `OnEvent` sender with
DOM-specific functionality. The latter can be attached to arbitrary `EventTarget`. It constructs an `OnDomEvent`
senders for each event type and dispatches DOM events.

```typescript
import { DomEventDispatcher } from '@proc7ts/fun-events';

const dispatcher = new DomEventDispatcher(document.getElementById('my-button'));

dispatcher.on('click').to(submit);
dispatcher.dispatch(new MouseEvent('click'));
```

### `OnDomEvent`

An `EventSender` implementation able to register DOM event listeners. It extends `OnEvent` interface with the following
methods:


#### `capture()`

Registers a capturing listener of DOM events.

This corresponds to specifying `true` or `{ capture: true }` as a second argument to `EventTarget.addEventListener()`.

```typescript
import { DomEventDispatcher } from '@proc7ts/fun-events';

const container = document.getElementById('my-container');

// Clicking on the inner elements would be handled by container first.
new DomEventDispatcher(container).on('click').capture(handleContainerClick);

// The above is the same as
container.addEventListener('click', handleContainerClick, true);
```


#### `instead()`

Registers a listener of DOM events to invoke instead of default action.

This listener invokes an `Event.preventDefault()` method prior to event handling.

```typescript
import { DomEventDispatcher } from '@proc7ts/fun-events';

// Clicking on the link won't lead to navigation.
new DomEventDispatcher(document.getElementById('my-href')).on('click').instead(doSomethingElse); 
```


#### `just()`

Registers a listener of DOM events preventing further propagation of current event in the capturing and bubbling phases.

This listener invokes an `Event.stopPropagation()` method prior to event handling.

```typescript
import { DomEventDispatcher } from '@proc7ts/fun-events';

// The ascendants won't receive a click the div.
new DomEventDispatcher(document.getElementById('my-div')).on('click').just(handleClick); 
```


#### `last()`

Registers the last DOM event listener.

This listener invokes an `Event.stopImmediatePropagation()` method prior to event handling.

```typescript
import { DomEventDispatcher } from '@proc7ts/fun-events';

const dispatcher = new DomEventDispatcher(document.getElementById('my-div'))
const onClick = dispatcher.on('click');

// The ascendants won't receive a click the div.
onClick.last(() => console.log('1')); // This is the last handler 
onClick(() => console.log('2'));      // This one won't be called

dispatcher.dispatch(new MouseEvent('click')); // console: 1 
```


#### `passive()`

Registers a DOM event listener that never calls `Event.preventDefault()`.

This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.

```typescript
import { DomEventDispatcher } from '@proc7ts/fun-events';

// Scrolling events won't be prevented.
new DomEventDispatcher(document.body).on('scroll').passive(handleScroll);

// The above is the same as
document.body.addEventListener('scroll', handleScroll, { passive: true });
```
