import { callThru, NextCall, noop, PassedThru } from 'call-thru';
import { EventArgs } from './event-args';
import { EventConsumer } from './event-consumer';
import Args = NextCall.Callee.Args;
import Out = NextCall.Outcome;

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
 * @param <C> A type of event consumer.
 */
export interface EventProducer<C extends EventConsumer<any, any, any>> {

  /**
   * Registers event consumer that will be notified on events.
   *
   * @param consumer A consumer to notify on events. The call has no effect if the same consumer is passed again.
   *
   * @return An event interest. The event producer will notify the consumer on events, until the `off()` method
   * of returned event interest instance is called.
   */
  (this: void, consumer: C): EventInterest;

  /**
   * Registers an event consumer the will be notified on the next event at most once.
   *
   * @param consumer A consumer to notify on next event.
   */
  once(consumer: C): EventInterest;

  thru<R1>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<EventArgs<Args<R1>>>>) => EventConsumer.Result<C>>;

  thru<
      R1,
      P2 extends Args<R1>, R2>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, EventArgs<Args<R2>>>>>) =>
          EventConsumer.Result<C>>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, EventArgs<Args<R3>>>>>>) =>
          EventConsumer.Result<C>>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, EventArgs<Args<R4>>>>>>>) =>
          EventConsumer.Result<C>>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, EventArgs<Args<R5>>>>>>>>) =>
          EventConsumer.Result<C>>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              EventArgs<Args<R6>>>>>>>>>) =>
          EventConsumer.Result<C>>;

  thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, EventArgs<Args<R7>>>>>>>>>>) =>
          EventConsumer.Result<C>>;

  /**
   * Constructs an event producer that passes the original event trough a chain of transformation passes.
   *
   * The passes are preformed by `callThru()` function.
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
      P8 extends Args<R7>, R8>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, Out<R7, EventArgs<Args<R8>>>>>>>>>>>) =>
          EventConsumer.Result<C>>;

  /*thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, Out<R7, Out<R8, EventArgs<Args<R9>>>>>>>>>>>>) =>
          EventConsumer.Result<C>>;*/

  /*thru<
      R1,
      P2 extends Args<R1>, R2,
      P3 extends Args<R2>, R3,
      P4 extends Args<R3>, R4,
      P5 extends Args<R4>, R5,
      P6 extends Args<R5>, R6,
      P7 extends Args<R6>, R7,
      P8 extends Args<R7>, R8,
      P9 extends Args<R8>, R9,
      P10 extends Args<R9>, R10>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => R10):
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, Out<R7, Out<R8, Out<R9, EventArgs<Args<R10>>>>>>>>>>>>>) =>
          EventConsumer.Result<C>>;*/

  /*thru<
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
      P11 extends Args<R10>, R11>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
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
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, Out<R7, Out<R8, Out<R9, Out<R10,
                  EventArgs<Args<R11>>>>>>>>>>>>>>) =>
          EventConsumer.Result<C>>;*/

  /*thru<
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
      P12 extends Args<R11>, R12>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
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
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, Out<R7, Out<R8, Out<R9, Out<R10,
                  Out<R11, EventArgs<Args<R12>>>>>>>>>>>>>>>) =>
          EventConsumer.Result<C>>;*/

  /*thru<
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
      P13 extends Args<R12>, R13>(
      fn1: (this: void, ...args: EventConsumer.Event<C>) => R1,
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
      EventProducer<(
          this: EventConsumer.This<C>,
          ...args: EventArgs.Of<PassedThru.Value<Out<R1, Out<R2, Out<R3, Out<R4, Out<R5,
              Out<R6, Out<R7, Out<R8, Out<R9, Out<R10,
                  Out<R11, Out<R12, EventArgs<Args<R13>>>>>>>>>>>>>>>>) =>
          EventConsumer.Result<C>>;*/

}

/**
 * An interest for the events.
 *
 * This is what returned returned from `EventProducer` when registering an event consumer.
 *
 * Once the consumer is no longer interested in receiving events, an `off()` method should be called, indicated the
 * lost of interest.
 */
export interface EventInterest {

  /**
   * A method to call to indicate the lost of interest in receiving events.
   *
   * Once called, the corresponding event consumer would no longer be called.
   *
   * Calling this method for the second time has no effect.
   */
  off(): void;

}

export namespace EventInterest {

  /**
   * No-op event interest.
   *
   * This is handy to use e.g. to initialize the fields.
   */
  export const none: EventInterest = {
    off: noop,
  };

}

export namespace EventProducer {

  /**
   * Converts an event consumer registration function to event producer.
   *
   * @param register An event consumer registration function returning an event interest.
   *
   * @returns An event producer instance registering consumers with `register` function.
   */
  export function of<C extends EventConsumer<any[], any, any>>(
      register: (this: void, consumer: C) => EventInterest): EventProducer<C> {

    const producer = (consumer => register(consumer)) as EventProducer<C>;

    producer.once = function (this: EventProducer<C>, consumer: C) {

      let interest = EventInterest.none;
      let off = false;

      const wrapper = ((...args: EventConsumer.Event<C>) => {
        interest.off();
        off = true;
        return consumer(...args) as EventConsumer.Result<C>;
      }) as C;

      interest = this(wrapper);

      if (off) {
        // The consumer is notified immediately during registration.
        // Unregister event interest right away.
        interest.off();
      }

      return interest;
    };

    const thru = callThru as any;

    producer.thru = function (this: EventProducer<C>, ...fns: any[]) {

      const transform = thru(...fns, captureEventArgs);

      return of((consumer: any) => this(function (...args: EventConsumer.Event<C>) {
        return consumer.apply(this, EventArgs.of(transform(...args)));
      } as C));
    };

    return producer;
  }

  /**
   * An event producer that never produces any events.
   */
  export const never: EventProducer<(...event: any[]) => any> = of(() => EventInterest.none);

}

function captureEventArgs<P extends any[]>(...args: P): EventArgs<P> {
  return { [EventArgs.args]: args };
}
