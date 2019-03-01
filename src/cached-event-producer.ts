import { EventProducer } from './event-producer';
import { afterEventKey, CachedEventSource } from './cached-event-source';
import { EventSource, onEventKey } from './event-source';
import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';

/**
 * An event producer that caches the last emitted event.
 *
 * It is guaranteed that event consumer registered in this producer will receive an event immediately upon registration.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export abstract class CachedEventProducer<E extends any[], R = void>
    extends EventProducer<E, R>
    implements CachedEventSource<E, R> {

  /**
   * The latest event tuple.
   */
  abstract readonly lastEvent: E;

  /**
   * Converts an event consumer registration function to cached event producer.
   *
   * The `initial` event will be reported until more events produced. After that the latest produced event will be
   * reported. If an event is reported immediately upon consumer registration, the `initial` event  won't be generated
   * or used.
   *
   * @param register An event consumer registration function returning an event interest.
   * @param initial A an event tuple to cache initially. Or a function creating such event. When omitted the initial
   * event is expected to be reported by `register` function. A consumer registration would lead to an error otherwise.
   *
   * @returns An event producer instance registering consumers with `register` function.
   */
  static of<E extends any[], R = void>(
      register: (this: void, consumer: EventConsumer<E, R>) => EventInterest,
      initial: ((this: void) => E) | E = noEvent): CachedEventProducer<E, R> {

    let _last: E | undefined;

    function last(): E {
      return _last || (_last = typeof initial === 'function' ? initial() : initial);
    }

    class CachedEvents extends CachedEventProducer<E, R> {

      get lastEvent() {
        return last();
      }

    }

    const producer = ((consumer: EventConsumer<E, R>) => {

      let reported = false;
      const interest = register((...event: E) => {
        _last = event;
        reported = true;
        return consumer(...event);
      });

      if (!reported) {
        consumer(...last());
      }

      return interest;
    }) as CachedEventProducer<E, R>;

    Object.setPrototypeOf(producer, CachedEvents.prototype);

    return producer;
  }

  /**
   * Builds a producer of latest events originated from the given cached event `source`.
   *
   * @param source A cached source of events.
   *
   * @returns Cached event producer.
   */
  static from<E extends any[], R = void>(source: CachedEventSource<E, R>): CachedEventProducer<E, R>;

  /**
   * Caches events from arbitrary event `source`.
   *
   * The `initial` event will be reported until the source produce more events. After that the latest produced event
   * will be reported. If event producer reports an event immediately upon consumer registration, the `initial` event
   * won't be generated or used.
   *
   * @param source A source of events.
   * @param initial A an event tuple to cache initially. Or a function creating such event.
   *
   * @returns Cached event producer.
   */
  static from<E extends any[], R = void>(
      source: EventSource<E, R>,
      initial?: ((this: void) => E) | E):
      CachedEventProducer<E, R>;

  static from<E extends any[], R>(
      source: EventSource<E, R> | CachedEventSource<E, R>,
      initial?: ((this: void) => E) | E):
      CachedEventProducer<E, R> {
    if (isCached(source)) {
      return CachedEventProducer.of(consumer => source[afterEventKey](consumer));
    }
    return CachedEventProducer.of(consumer => source[onEventKey](consumer), initial);
  }

  get [afterEventKey](): this {
    return this;
  }

}

function isCached<E extends any[], R>(
    source: EventSource<E, R> | CachedEventSource<E, R>):
    source is CachedEventSource<E, R> {
  return afterEventKey in source;
}

function noEvent(): never {
  throw new Error('No emitted events');
}
