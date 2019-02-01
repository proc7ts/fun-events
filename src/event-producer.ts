import { callThru, NextCall } from 'call-thru';
import { EventConsumer } from './event-consumer';
import { EventInterest } from './event-interest';
import { EventSource } from './event-source';
import { EventEmitter } from './event-emitter';
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
  static readonly never: EventProducer<any, any> = EventProducer.of(() => EventInterest.none);

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

  get [EventSource.on](): this {
    return this;
  }

  /**
   * Registers an event consumer the will be notified on the next event at most once.
   *
   * @param consumer A consumer to notify on next event.
   */
  once(consumer: EventConsumer<E, R>): EventInterest {

    let interest = EventInterest.none;
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

  /**
   * Constructs an event producer that passes the original event trough a chain of transformation passes.
   *
   * The passes are preformed by `callThru()` function.
   *
   * The consumers registered with resulting producer are called as a last pass in chain. Only the last registered
   * consumer call result is respected.
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

  thru(...fns: any[]): EventProducer<any[], R> {

    const factory: EventProducerFactory = this.constructor as any;
    let shared: [EventEmitter<any[], R>, EventInterest] | undefined;

    return factory.of((consumer: EventConsumer<any[], R>) => {

      const emitter = shared || (shared = thruEmitter<R>(this, fns));
      const interest = shared[0].on(consumer);

      return {
        off() {
          interest.off();
          if (!emitter[0].consumers) {
            emitter[1].off();
            shared = undefined;
          }
        }
      };
    });
  }

}

function thruEmitter<R>(producer: EventProducer<any[], R>, fns: any[]): [EventEmitter<any[], R>, EventInterest] {

  const shared = new EventEmitter<any[], R>();
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
