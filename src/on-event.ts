/**
 * @module fun-events
 */
import { callThru, NextCall } from 'call-thru';
import { AfterEvent__symbol } from './event-keeper';
import { eventReceiver, EventReceiver } from './event-receiver';
import { EventSender, isEventSender, OnEvent__symbol } from './event-sender';
import { EventSupplier } from './event-supplier';
import { eventSupply, EventSupply, noEventSupply } from './event-supply';
import { once, share, tillOff } from './impl';
import Result = NextCall.CallResult;

/**
 * An event receiver registration function interface.
 *
 * A registered event receiver would receive upcoming events, until the returned event supply will be
 * {@link EventSupply.off cut off}.
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
   * An [[OnEvent]] sender derived from this one that stops sending events to registered receiver after the first one.
   */
  get once(): OnEvent<E> {
    return onEventBy(once(this));
  }

  /**
   * Builds an [[OnEvent]] sender that sends events from this one until the required `supply` is cut off.
   *
   * @param supply  The required event supply.
   *
   * @returns New event sender.
   */
  tillOff(supply: EventSupply): OnEvent<E> {
    return onEventBy(tillOff(this, supply));
  }

  /**
   * Extracts event suppliers from incoming events.
   *
   * @typeparam F  Extracted event type.
   * @param extract  A function extracting event supplier from incoming event. May return `undefined` when nothing
   * extracted.
   *
   * @returns An [[OnEvent]] sender of events from extracted suppliers. The events supply is cut off once the incoming
   * events supply do. The returned sender shares the supply of extracted events among receivers.
   */
  dig<F extends any[]>(
      extract: (this: void, ...event: E) => EventSupplier<F> | void | undefined,
  ): OnEvent<F> {
    return onEventBy(share(this.dig_(extract)));
  }

  /**
   * Extracts event suppliers from incoming events without sharing extracted events supply.
   *
   * This method does the same as [[OnEvent.dig]] one, except it does not share the supply of extracted events among
   * receivers. This may be useful e.g. when the result will be further transformed. It is wise to {@link share share}
   * the supply of events from final result in this case.
   *
   * @typeparam F  Extracted event type.
   * @param extract  A function extracting event supplier from incoming event. May return `undefined` when
   * nothing extracted.
   *
   * @returns An [[OnEvent]] sender of events from extracted suppliers. The events supply is cut off once the incoming
   * events supply do.
   */
  dig_<F extends any[]>(
      extract: (this: void, ...event: E) => EventSupplier<F> | void | undefined,
  ): OnEvent<F> {
    return onEventBy((receiver: EventReceiver.Generic<F>) => {

      let nestedSupply = noEventSupply();

      this({
        supply: receiver.supply,
        receive(_context, ...event: E)  {

          const prevSupply = nestedSupply;
          const extracted = extract(...event);

          try {
            nestedSupply = extracted
                ? onSupplied(extracted)({
                  supply: eventSupply().needs(receiver.supply),
                  receive(context, ...nestedEvent) {
                    receiver.receive(context, ...nestedEvent);
                  },
                })
                : noEventSupply();
          } finally {
            prevSupply.off();
          }
        },
      });
    });
  }

  /**
   * Consumes events.
   *
   * @param consume  A function consuming events. This function may return an {@link EventSupply event supply} instance
   * when registers a nested event receiver. This supply will be cut of on new event.
   *
   * @returns An event supply that will stop consuming events once {@link EventSupply.off cut off}.
   */
  consume(consume: (...event: E) => EventSupply | void | undefined): EventSupply {

    let consumerSupply = noEventSupply();
    const senderSupply = this((...event: E) => {

      const prevSupply = consumerSupply;

      try {
        consumerSupply = consume(...event) || noEventSupply();
      } finally {
        prevSupply.off();
      }
    });

    return eventSupply(reason => {
      consumerSupply.off(reason);
      senderSupply.off(reason);
    }).needs(senderSupply);
  }

  /**
   * Constructs an [[OnEvent]] sender that shares events supply among all registered receivers.
   *
   * The created sender receives events from this one and sends to registered receivers. The shared sender registers
   * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
   * supplies do.
   *
   * @returns An [[OnEvent]] sender sharing a common supply of events originated from this sender.
   */
  share(): OnEvent<E> {
    return onEventBy(share(this));
  }

  /**
   * Constructs an [[OnEvent]] sender of original events passed trough the chain of transformations.
   *
   * The passes are preformed by `callThru()` function. The event receivers registered by resulting event sender
   * are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An [[OnEvent]] sender of events transformed with provided passes. The returned sender shares the supply
   * of transformed events among receivers.
   */
  thru<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, void, void, void>,
  ): OnEvent<R1>;

  thru<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): OnEvent<[R1]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, void, void, void>,
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
      fn5: (this: void, ...args: P5) => NextCall<any, R5, void, void, void>,
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
      fn6: (this: void, ...args: P6) => NextCall<any, R6, void, void, void>,
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
      fn7: (this: void, ...args: P7) => NextCall<any, R7, void, void, void>,
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
      fn8: (this: void, ...args: P8) => NextCall<any, R8, void, void, void>,
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
      fn9: (this: void, ...args: P9) => NextCall<any, R9, void, void, void>,
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
      fn10: (this: void, ...args: P10) => NextCall<any, R10, void, void, void>,
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
      fn11: (this: void, ...args: P11) => NextCall<any, R11, void, void, void>,
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
      fn12: (this: void, ...args: P12) => NextCall<any, R12, void, void, void>,
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
      fn13: (this: void, ...args: P13) => NextCall<any, R13, void, void, void>,
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
    return onEventBy(share((this as any).thru_(...fns)));
  }

  /**
   * Constructs an [[OnEvent]] sender of original events passed trough the chain of transformations without sharing
   * the transformed events supply.
   *
   * This method does the same as [[OnEvent.thru]] one, except it does not share the supply of transformed events
   * among receivers. This may be useful e.g. when the result will be further transformed anyway. It is wise to
   * {@link share share} the supply of events from final result in this case.
   *
   * @returns An [[OnEvent]] sender of events transformed with provided passes.
   */
  thru_<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, void, void, void>,
  ): OnEvent<R1>;

  thru_<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): OnEvent<[R1]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, void, void, void>,
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
      fn5: (this: void, ...args: P5) => NextCall<any, R5, void, void, void>,
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
      fn6: (this: void, ...args: P6) => NextCall<any, R6, void, void, void>,
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
      fn7: (this: void, ...args: P7) => NextCall<any, R7, void, void, void>,
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
      fn8: (this: void, ...args: P8) => NextCall<any, R8, void, void, void>,
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
      fn9: (this: void, ...args: P9) => NextCall<any, R9, void, void, void>,
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
      fn10: (this: void, ...args: P10) => NextCall<any, R10, void, void, void>,
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
      fn11: (this: void, ...args: P11) => NextCall<any, R11, void, void, void>,
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
      fn12: (this: void, ...args: P12) => NextCall<any, R12, void, void, void>,
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
      fn13: (this: void, ...args: P13) => NextCall<any, R13, void, void, void>,
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
        this({
          supply: receiver.supply,
          receive(context, ...event) {
            thru(
                ...fns,
                (...transformed: any[]) => receiver.receive(context, ...transformed),
            )(...event);
          },
        }));
  }

}

export interface OnEvent<E extends any[]> {

  /**
   * Registers a receiver of events sent by this sender.
   *
   * @param receiver  A receiver of events to register.
   *
   * @returns A supply of events from this sender to the given `receiver`.
   */
  (this: void, receiver: EventReceiver<E>): EventSupply; // tslint:disable-line:callable-types

}

/**
 * Converts a plain event receiver registration function to [[OnEvent]] sender.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param register  Generic event receiver registration function. It will be called on each receiver registration,
 * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
 *
 * @returns An [[OnEvent]] sender registering event receivers with the given `register` function.
 */
export function onEventBy<E extends any[]>(
    register: (this: void, receiver: EventReceiver.Generic<E>) => void,
): OnEvent<E> {

  const onEvent = ((receiver: EventReceiver<E>) => {

    const generic = eventReceiver(receiver);
    const { supply } = generic;

    if (!supply.isOff) {
      register(generic);
    }

    return supply;
  }) as OnEvent<E>;

  Object.setPrototypeOf(onEvent, OnEvent.prototype);

  return onEvent;
}

/**
 * Builds an [[OnEvent]] sender of events supplied by the given `supplier`.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param supplier  An event supplier.
 *
 * @returns An [[OnEvent]] sender of events originated from the given `supplier`.
 */
export function onSupplied<E extends any[]>(supplier: EventSupplier<E>): OnEvent<E> {

  const onEvent = isEventSender(supplier) ? supplier[OnEvent__symbol] : supplier[AfterEvent__symbol];

  if (onEvent instanceof OnEvent) {
    return onEvent;
  }

  return onEventBy(onEvent.bind(supplier));
}

/**
 * An [[OnEvent]] sender that never sends any events.
 *
 * @category Core
 */
export const onNever: OnEvent<any> =
    /*#__PURE__*/ onEventBy(({ supply }) => supply.off());
