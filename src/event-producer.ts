import { callThru, NextCall } from 'call-thru';
import { EventConsumer } from './event-consumer';
import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { EventSource, onEventKey } from './event-source';
import { EventNotifier } from './event-notifier';
import Args = NextCall.Callee.Args;

/**
 * Event producer is a function accepting an event consumer as its only argument.
 *
 * Once called, the consumer will be notified on events, while the consumer is interested in receiving them.
 *
 * Note that event producer is a function, not a method.
 *
 * An event producer also has a set of handy methods. More could be added at later time.
 *
 * To convert a plain function into `EventProducer` an `EventProducer.of()` function can be used.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export abstract class EventProducer<E extends any[], R = void> extends Function implements EventSource<E, R> {

  /**
   * An event producer that never produces any events.
   */
  static get never(): EventProducer<any, any> {
    return NEVER; // tslint:disable-line:no-use-before-declare
  }

  /**
   * Converts an event consumer registration function to event producer.
   *
   * @param register An event consumer registration function returning an event interest.
   *
   * @returns An event producer instance registering consumers with `register` function.
   */
  static of<E extends any[], R = void>(
      register: (this: void, consumer: EventConsumer<E, R>) => EventInterest): EventProducer<E, R> {

    const producer = ((consumer: EventConsumer<E, R>) => register(consumer)) as EventProducer<E, R>;

    Object.setPrototypeOf(producer, EventProducer.prototype);

    return producer;
  }

  /**
   * Builds a producer of events originated from the given event `source`.
   *
   * @param source A source of events to produce.
   *
   * @returns Event producer instance.
   */
  static from<E extends any[], R>(source: EventSource<E, R>): EventProducer<E, R> {
    return EventProducer.of(consumer => source[onEventKey](consumer));
  }

  get [onEventKey](): this {
    return this;
  }

  /**
   * Registers an event consumer the will be notified on the next event at most once.
   *
   * @param consumer A consumer to notify on next event.
   */
  once(consumer: EventConsumer<E, R>): EventInterest {

    let interest = noEventInterest();
    let off = false;

    const wrapper: EventConsumer<E, R> = (...args: E) => {
      interest.off();
      off = true;
      return consumer(...args);
    };

    interest = this(wrapper);

    if (off) {
      // The consumer is notified immediately during registration.
      // Unregister event interest right away.
      interest.off();
    }

    return interest;
  }

  thru<R1,
      TE extends Args<R1>>(
      fn1: (this: void, ...args: E) => R1):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      TE extends Args<R2>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      TE extends Args<R3>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      TE extends Args<R4>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      TE extends Args<R5>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      TE extends Args<R6>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      TE extends Args<R7>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      TE extends Args<R8>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      TE extends Args<R9>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      TE extends Args<R10>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      P11 extends Args<R10>, R11,
      TE extends Args<R11>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10,
      fn11: (this: void, ...args: P11) => R11):
      EventProducer<TE, R>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      P11 extends Args<R10>, R11,
      P12 extends Args<R11>, R12,
      TE extends Args<R12>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10,
      fn11: (this: void, ...args: P11) => R11,
      fn12: (this: void, ...args: P12) => R12):
      EventProducer<TE, R>;

  /**
   * Constructs an event producer that passes the original event trough a chain of transformation passes.
   *
   * The passes are preformed by `callThru()` function. The consumers registered with resulting producer are called
   * as a last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * The event processing result is the one of the last registered consumer.
   *
   * @returns A producer of event transformed with provided passes.
   */
  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10,
      P11 extends Args<R10>, R11,
      P12 extends Args<R11>, R12,
      P13 extends Args<R12>, R13,
      TE extends Args<R13>>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10,
      fn11: (this: void, ...args: P11) => R11,
      fn12: (this: void, ...args: P12) => R12,
      fn13: (this: void, ...args: P13) => R13):
      EventProducer<TE, R>;

  thru(...fns: any[]): EventProducer<any[], R> {

    const factory: EventProducerFactory = this.constructor as any;
    let shared: [EventNotifier<any[], R>, EventInterest] | undefined;

    return factory.of((consumer: EventConsumer<any[], R>) => {

      const emitter = shared || (shared = thruNotifier<R>(this, fns));
      const interest = shared[0].on(consumer);

      return eventInterest(() => {
        interest.off();
        if (!emitter[0].consumers) {
          emitter[1].off();
          shared = undefined;
        }
      });
    });
  }

}

const NEVER: EventProducer<any, any> = /*#__PURE__*/ EventProducer.of(() => noEventInterest());

function thruNotifier<R>(producer: EventProducer<any[], R>, fns: any[]): [EventNotifier<any[], R>, EventInterest] {

  const shared = new EventNotifier<any[], R>();
  const thru = callThru as any;
  const transform = thru(...fns, (...event: any[]) => {

    let result: R = undefined!;

    shared.forEach(c => {
      result = c(...event);
    });

    return result;
  });

  const interest = producer(transform);

  return [shared, interest];
}

export interface EventProducer<E extends any[], R = void> {

  /**
   * Registers event consumer that will be notified on events.
   *
   * @param consumer A consumer to notify on events.
   *
   * @return An event interest. The event producer will notify the consumer on events, until the `off()` method
   * of returned event interest instance is called.
   */
  // tslint:disable-next-line:callable-types
  (this: void, consumer: EventConsumer<E, R>): EventInterest;

}

interface  EventProducerFactory {

  of<E extends any[], R = void>(
      register: (this: void, consumer: EventConsumer<E, R>) => EventInterest): EventProducer<E, R>;

}
