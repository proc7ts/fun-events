import { noop } from 'call-thru';
import { EventEmitter } from './event-emitter';
import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { AfterEvent__symbol, EventKeeper, isEventKeeper } from './event-keeper';
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { OnEvent } from './on-event';

/**
 * A kept and upcoming events receiver registration function interface.
 *
 * The registered event receiver would receive the kept event immediately upon registration, and all upcoming events
 * after that.
 *
 * To convert a plain event receiver registration function to `AfterEvent` an `afterEventBy()` function can be used.
 *
 * @typeparam E An event type. This is a list of event receiver parameter types.
 */
export abstract class AfterEvent<E extends any[]> extends OnEvent<E> implements EventKeeper<E> {

  /**
   * The kept event tuple.
   *
   * This is the last event sent. If no events sent yet, then tries to receive one first.
   */
  abstract readonly kept: E;

  get [AfterEvent__symbol](): this {
    return this;
  }

  /**
   * Constructs an event receiver registrar that shares an event interest among all registered receivers.
   *
   * The created registrar receives events from this one and sends them to receivers. The shared registrar registers
   * a receiver in this one only once, when first receiver registered. And loses its interest when all receivers lost
   * their interest.
   *
   * @returns An `AfterEvent` registrar of receivers sharing a common interest to events sent by this sender.
   */
  share(): AfterEvent<E> {
    return afterEventBy(super.share());
  }

}

/**
 * Converts a plain event receiver registration function to `AfterEvent` registrar.
 *
 * The `initial` event will be kept until more events received. After that the latest event sent will be kept.
 * If an event is sent immediately upon receiver registration, the `initial` event won't be created or sent.
 *
 * @typeparam E An event type. This is a list of event receiver parameter types.
 * @param register An event receiver registration function returning an event interest.
 * @param initial An event tuple to keep initially. Or a function creating such event. When omitted the initial
 * event is expected to be sent by `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns An `AfterEvent` registrar instance registering event receivers with the given `register` function.
 */
export function afterEventBy<E extends any[]>(
    register: (this: void, receiver: EventReceiver<E>) => EventInterest,
    initial: ((this: void) => E) | E = noEvent): AfterEvent<E> {

  let _last: E | undefined;

  function last(): E {
    return _last || (_last = typeof initial === 'function' ? initial() : initial);
  }

  class After extends AfterEvent<E> {

    get kept() {
      if (_last) {
        // The last event sent.
        return _last;
      }
      this.once(noop); // Try to receive an event first.
      return last(); // This should return the last event sent, or throw an exception.
    }

  }

  const afterEvent = ((receiver: EventReceiver<E>) => {

    let reported = false;
    const interest = register((...event: E) => {
      _last = event;
      reported = true;
      return receiver(...event);
    });

    if (!reported && !interest.done) {
      receiver(...last());
    }

    return interest;
  }) as AfterEvent<E>;

  Object.setPrototypeOf(afterEvent, After.prototype);

  return afterEvent;
}

/**
 * Builds an `AfterEvent` registrar of receivers of events kept and sent by the given `keeper`.
 *
 * @typeparam E An event type. This is a list of event receiver parameter types.
 * @param keeper A keeper of events.
 *
 * @returns An `AfterEvent` registrar instance.
 */
export function afterEventFrom<E extends any[]>(keeper: EventKeeper<E>): AfterEvent<E>;

/**
 * Builds an `AfterEvent` registrar of receivers of events sent by the given `sender`.
 *
 * The `initial` event will be kept until the `sender` send more events. After that the latest event sent will be
 * kept. If the `sender` sends an event immediately upon receiver registration, the `initial` event won't be created
 * or used.
 *
 * @typeparam E An event type. This is a list of event receiver parameter types.
 * @param sender An event sender.
 * @param initial A an event tuple to keep initially. Or a function creating such event.
 *
 * @returns An `AfterEvent` registrar instance.
 */
export function afterEventFrom<E extends any[]>(
    sender: EventSender<E>,
    initial?: ((this: void) => E) | E):
    AfterEvent<E>;

export function afterEventFrom<E extends any[], R>(
    senderOrKeeper: EventSender<E> | EventKeeper<E>,
    initial?: ((this: void) => E) | E):
    AfterEvent<E> {
  if (!isEventKeeper(senderOrKeeper)) {
    return afterEventBy(senderOrKeeper[OnEvent__symbol].bind(senderOrKeeper), initial);
  }

  const afterEvent = senderOrKeeper[AfterEvent__symbol];

  if (afterEvent instanceof AfterEvent) {
    return afterEvent;
  }

  return afterEventBy(afterEvent.bind(senderOrKeeper));
}

/**
 * Builds an `AfterEvent` registrar of receivers of the `event`.
 *
 * @param event An event that will be sent to all receivers upon registration.
 */
export function afterEventOf<E extends any[]>(...event: E): AfterEvent<E> {
  return afterEventFrom(new EventEmitter<E>(), event);
}

/**
 * An `AfterEvent` registrar of receivers that would never receive any events.
 */
export const afterNever: AfterEvent<any> = /*#__PURE__*/ afterEventBy(noEventInterest);

function noEvent(): never {
  throw new Error('No events to send');
}

/**
 * Builds an `AfterEvent` registrar of receivers of events sent by all event keepers in `source` map.
 *
 * @typeparam S A type of `sources` map.
 * @param sources A map of named event keepers the events are originated from.
 *
 * @returns An event keeper sending a map of events received from each event keeper. Each event in this map has the
 * same name as its originating event keeper in `sources`.
 */
export function afterEventFromAll<S extends { readonly [key: string]: EventKeeper<any> }>(sources: S):
    AfterEvent<[{ readonly [key in keyof S]: EventKeeper.Event<S[key]> }]> {
  return afterEventBy<[{ [key in keyof S]: EventKeeper.Event<S[key]> }]>(receiver => {

    const kept: { [key in keyof S]: EventKeeper.Event<S[key]> } = {} as any;
    const interests: EventInterest[] = [];
    const interest = eventInterest(reason => {
      interests.forEach(i => i.off(reason));
    });
    // Do not send events until receiving from all sources.
    let send: (event: { [key in keyof S]: EventKeeper.Event<S[key]> }) => void = noop;

    // Registering source receivers.
    Object.keys(sources).forEach(key => {
      if (!interest.done) {

        const source = sources[key];
        const sourceInterest = source[AfterEvent__symbol]((...event) => {
          kept[key] = event;
          send(kept);
        });

        interests.push(sourceInterest);
        interest.needs(sourceInterest);
      }
    });
    if (!interest.done) {
      // Now receiving events from all sources.
      // Start sending them.
      send = receiver;
      receiver(kept);
    }

    return interest;
  }).share();
}
