import { callThru, NextCall } from 'call-thru';
import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { AfterEvent__symbol, EventKeeper } from './event-keeper';
import { EventNotifier } from './event-notifier';
import { EventReceiver, receiveEventsBy } from './event-receiver';
import { EventSender, isEventSender, OnEvent__symbol } from './event-sender';
import Result = NextCall.CallResult;

/**
 * An event receiver registration function interface.
 *
 * Once called, the receiver will start receiving the events while still interested.
 *
 * An [[OnEvent]] function also has a set of handy methods. More could be added later. It also can be used as
 * [[EventSender]].
 *
 * To convert a plain event receiver registration function to [[OnEvent]] an [[onEventBy]] function can be used.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export abstract class OnEvent<E extends any[]> extends Function implements EventSender<E> {

  get [OnEvent__symbol](): this {
    return this;
  }

  /**
   * Registers the next event receiver. It won't receive any events after receiving the first one.
   *
   * @param receiver  Next event receiver.
   *
   * @returns An event interest. The receiver won't receive any events if the [[EventInterest.off]] method
   * of the returned event interest is called before any event is sent.
   */
  once(receiver: EventReceiver<E>): EventInterest {

    let interest = eventInterest();

    const wrapper: EventReceiver<E> = function (...args: E) {
      if (!interest.done) {
        interest.off();
        receiver.apply(this, args);
      }
    };

    return interest = this(wrapper).needs(interest);
  }

  /**
   * Extracts event senders from incoming events.
   *
   * @typeparam F  Extracted event type.
   * @param extract  A function extracting event sender or event keeper from incoming event. May return `undefined` when
   * nothing extracted.
   *
   * @returns An [[OnEvent]] registrar of extracted events receivers. The events exhaust once the incoming events do.
   * The returned registrar shares the interest to extracted events among receivers.
   */
  dig<F extends any[]>(
      extract: (this: void, ...event: E) => EventSender<F> | EventKeeper<F> | void | undefined,
  ): OnEvent<F> {
    return shareInterestTo(this.dig_(extract));
  }

  /**
   * Extracts event senders from incoming events.
   *
   * This method does the same as [[OnEvent.dig]] one, except it does not share the interest to extracted events among
   * receivers. This may be useful e.g. when the result will be further transformed. It is wise to share the
   * interest to final result in this case.
   *
   * @typeparam F  Extracted event type.
   * @param extract  A function extracting event sender or event keeper from incoming event. May return `undefined` when
   * nothing extracted.
   *
   * @returns An [[OnEvent]] registrar of extracted events receivers. The events exhaust once the incoming events do.
   */
  dig_<F extends any[]>(
      extract: (this: void, ...event: E) => EventSender<F> | EventKeeper<F> | void | undefined,
  ): OnEvent<F> {
    return onEventBy((receiver: EventReceiver<F>) => {

      let nestedInterest = noEventInterest();
      const senderInterest = this((...event: E) => {

        const prevInterest = nestedInterest;
        const extracted = extract(...event);

        try {
          nestedInterest = extracted ? onEventFrom(extracted)(receiver) : noEventInterest();
        } finally {
          prevInterest.off();
        }
      });

      return eventInterest(reason => {
        nestedInterest.off(reason);
        senderInterest.off(reason);
      }).needs(senderInterest);
    });
  }

  /**
   * Consumes events.
   *
   * @param consume  A function consuming events. This function may return an [[EventInterest]] instance when registers
   * a nested event receiver. This interest will be lost on new event.
   *
   * @returns An event interest that will stop consuming events once lost.
   */
  consume(consume: (...event: E) => EventInterest | void | undefined): EventInterest {

    let consumerInterest = noEventInterest();
    const senderInterest = this((...event: E) => {

      const prevInterest = consumerInterest;

      try {
        consumerInterest = consume(...event) || noEventInterest();
      } finally {
        prevInterest.off();
      }
    });

    return eventInterest(reason => {
      consumerInterest.off(reason);
      senderInterest.off(reason);
    }).needs(senderInterest);
  }

  /**
   * Constructs an event receiver registrar that shares an event interest among all registered receivers.
   *
   * The created registrar receives events from this one and sends them to receivers. The shared registrar registers
   * a receiver in this one only once, when first receiver registered. And loses its interest when all receivers lost
   * their interest.
   *
   * @returns An [[OnEvent]] registrar of receivers sharing a common interest to events sent by this sender.
   */
  share(): OnEvent<E> {
    return shareInterestTo(this);
  }

  /**
   * Constructs an [[OnEvent]] registrar of receivers of original events passed trough the chain of transformations.
   *
   * The passes are preformed by `callThru()` function. The event receivers registered by resulting [[OnEvent]]
   * registrar are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An [[OnEvent]] registrar of receivers of events transformed with provided passes. The returned registrar
   * shares the interest to transformed events among receivers.
   */
  thru<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, any, any, any>,
  ): OnEvent<R1>;

  thru<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): OnEvent<[R1]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, any, any, any>,
  ): OnEvent<R2>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
  ): OnEvent<[R2]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
  ): OnEvent<R3>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], RE>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => RE,
  ): OnEvent<[RE]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
  ): OnEvent<[R4]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => NextCall<any, R5, any, any, any>,
  ): OnEvent<R5>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
  ): OnEvent<[R5]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => NextCall<any, R6, any, any, any>,
  ): OnEvent<R6>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
  ): OnEvent<[R6]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => NextCall<any, R7, any, any, any>,
  ): OnEvent<R7>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
  ): OnEvent<[R7]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => NextCall<any, R8, any, any, any>,
  ): OnEvent<R8>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
  ): OnEvent<[R8]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => NextCall<any, R9, any, any, any>,
  ): OnEvent<R9>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
  ): OnEvent<[R9]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => NextCall<any, R10, any, any, any>,
  ): OnEvent<R10>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10>(
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
  ): OnEvent<[R10]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends any[]>(
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
      fn11: (this: void, ...args: P11) => NextCall<any, R11, any, any, any>,
  ): OnEvent<R11>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11>(
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
  ): OnEvent<[R11]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12 extends any[]>(
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
      fn12: (this: void, ...args: P12) => NextCall<any, R12, any, any, any>,
  ): OnEvent<R12>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12>(
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
  ): OnEvent<[R12]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12 extends Result<P13>,
      P13 extends any[], R13 extends any[]>(
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
      fn13: (this: void, ...args: P13) => NextCall<any, R13, any, any, any>,
  ): OnEvent<R13>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12 extends Result<P13>,
      P13 extends any[], R13>(
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
      fn13: (this: void, ...args: P13) => R13,
  ): OnEvent<[R13]>;

  thru(...fns: any[]): OnEvent<any[]> {
    return shareInterestTo((this as any).thru_(...fns));
  }

  /**
   * Constructs an [[OnEvent]] registrar of receivers of original events passed trough the chain of transformations
   * without sharing the result.
   *
   * This method does the same as [[OnEvent.thru]] one, except it does not share the interest to transformed events
   * among receivers. This may be useful e.g. when the result will be further transformed anyway. It is wise to share
   * the interest to final result in this case.
   *
   * @returns An [[OnEvent]] registrar of receivers of events transformed with provided passes.
   */
  thru_<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, any, any, any>,
  ): OnEvent<R1>;

  thru_<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): OnEvent<[R1]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, any, any, any>,
  ): OnEvent<R2>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
  ): OnEvent<[R2]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
  ): OnEvent<R3>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], RE>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => RE,
  ): OnEvent<[RE]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
  ): OnEvent<[R4]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => NextCall<any, R5, any, any, any>,
  ): OnEvent<R5>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
  ): OnEvent<[R5]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => NextCall<any, R6, any, any, any>,
  ): OnEvent<R6>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
  ): OnEvent<[R6]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => NextCall<any, R7, any, any, any>,
  ): OnEvent<R7>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
  ): OnEvent<[R7]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => NextCall<any, R8, any, any, any>,
  ): OnEvent<R8>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
  ): OnEvent<[R8]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => NextCall<any, R9, any, any, any>,
  ): OnEvent<R9>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
  ): OnEvent<[R9]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
      fn5: (this: void, ...args: P5) => R5,
      fn6: (this: void, ...args: P6) => R6,
      fn7: (this: void, ...args: P7) => R7,
      fn8: (this: void, ...args: P8) => R8,
      fn9: (this: void, ...args: P9) => R9,
      fn10: (this: void, ...args: P10) => NextCall<any, R10, any, any, any>,
  ): OnEvent<R10>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10>(
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
  ): OnEvent<[R10]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends any[]>(
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
      fn11: (this: void, ...args: P11) => NextCall<any, R11, any, any, any>,
  ): OnEvent<R11>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11>(
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
  ): OnEvent<[R11]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12 extends any[]>(
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
      fn12: (this: void, ...args: P12) => NextCall<any, R12, any, any, any>,
  ): OnEvent<R12>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12>(
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
  ): OnEvent<[R12]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12 extends Result<P13>,
      P13 extends any[], R13 extends any[]>(
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
      fn13: (this: void, ...args: P13) => NextCall<any, R13, any, any, any>,
  ): OnEvent<R13>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4 extends Result<P5>,
      P5 extends any[], R5 extends Result<P6>,
      P6 extends any[], R6 extends Result<P7>,
      P7 extends any[], R7 extends Result<P8>,
      P8 extends any[], R8 extends Result<P9>,
      P9 extends any[], R9 extends Result<P10>,
      P10 extends any[], R10 extends Result<P11>,
      P11 extends any[], R11 extends Result<P12>,
      P12 extends any[], R12 extends Result<P13>,
      P13 extends any[], R13>(
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
      fn13: (this: void, ...args: P13) => R13,
  ): OnEvent<[R13]>;

  thru_(...fns: any[]): OnEvent<any[]> {

    const thru = callThru as any;

    return onEventBy(receiver =>
        this(function (...event) {
          return thru(
              ...fns,
              (...transformed: any[]) => receiver.apply(this, transformed),
          )(...event);
        }));
  }

}

export interface OnEvent<E extends any[]> {

  /**
   * Registers a receiver of events.
   *
   * @param receiver  A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the [[EventInterest.off]] method
   * of the returned event interest is called.
   */
  (this: void, receiver: EventReceiver<E>): EventInterest; // tslint:disable-line:callable-types

}

/**
 * Converts a plain event receiver registration function to [[OnEvent]] registrar.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param register  An event receiver registration function returning an event interest.
 *
 * @returns An [[OnEvent]] registrar instance registering event receivers with the given `register` function.
 */
export function onEventBy<E extends any[]>(
    register: (this: void, receiver: EventReceiver<E>) => EventInterest,
): OnEvent<E> {

  const onEvent = ((receiver: EventReceiver<E>) => register(receiver)) as OnEvent<E>;

  Object.setPrototypeOf(onEvent, OnEvent.prototype);

  return onEvent;
}

/**
 * Builds an [[OnEvent]] registrar of receivers of events sent by the given sender or keeper.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param senderOrKeeper  An event sender or keeper.
 *
 * @returns An [[OnEvent]] registrar instance.
 */
export function onEventFrom<E extends any[]>(senderOrKeeper: EventSender<E> | EventKeeper<E>): OnEvent<E> {

  const onEvent = isEventSender(senderOrKeeper) ? senderOrKeeper[OnEvent__symbol] : senderOrKeeper[AfterEvent__symbol];

  // noinspection SuspiciousTypeOfGuard
  if (onEvent instanceof OnEvent) {
    return onEvent;
  }

  return onEventBy(onEvent.bind(senderOrKeeper));
}

/**
 * An [[OnEvent]] registrar of receivers that would never receive any events.
 *
 * @category Core
 */
export const onNever: OnEvent<any> = /*#__PURE__*/ onEventBy(noEventInterest);

/**
 * Builds an [[OnEvent]] registrar of receivers of events sent by any of the given senders of keepers.
 *
 * The resulting event sender exhausts as soon as all sources do.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param sources  Event senders or keepers the events originated from.
 *
 * @returns An [[OnEvent]] registrar instance.
 */
export function onEventFromAny<E extends any[]>(...sources: (EventSender<E> | EventKeeper<E>)[]): OnEvent<E> {
  if (!sources.length) {
    return onNever;
  }

  return onEventBy<E>(receiver => {

    let remained = sources.length;
    let interests: EventInterest[] = [];
    const interest = eventInterest(interestLost);

    interests = sources.map(source => onEventFrom(source)(receiver).whenDone(sourceDone));

    return interest;

    function interestLost(reason: any) {
      interests.forEach(i => i.off(reason));
    }

    function sourceDone(reason: any) {
      if (!--remained) {
        interest.off(reason);
        interests = [];
      }
    }
  }).share();
}

function shareInterestTo<E extends any[]>(onEvent: OnEvent<E>): OnEvent<E> {

  const shared = new EventNotifier<E>();
  let sourceInterest = noEventInterest();
  let initialEvents: E[] | undefined = [];
  let hasReceivers = false;

  return onEventBy(receiver => {
    if (!shared.size) {
      sourceInterest = onEvent((...event) => {
        if (initialEvents) {
          if (hasReceivers) {
            // More events received
            // Stop sending initial ones
            initialEvents = undefined;
          } else {
            // Record events received during first receiver registration
            // to send them to all receivers until more event received
            initialEvents.push(event);
          }
        }
        shared.send(...event);
      });
    }

    const interest = shared.on(receiver).whenDone(reason => {
      if (!shared.size) {
        sourceInterest.off(reason);
        sourceInterest = noEventInterest();
        initialEvents = [];
        hasReceivers = false;
      }
    }).needs(sourceInterest);

    hasReceivers = true;

    if (initialEvents) {
      // Send initial events to just registered receiver

      const dispatcher = receiveEventsBy(receiver);

      initialEvents.forEach(event => dispatcher(...event));
    }

    return interest;
  });
}
