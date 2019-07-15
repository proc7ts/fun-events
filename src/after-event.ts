import { NextCall, noop } from 'call-thru';
import { EventEmitter } from './event-emitter';
import { EventInterest, noEventInterest } from './event-interest';
import { AfterEvent__symbol, EventKeeper, isEventKeeper } from './event-keeper';
import { EventNotifier } from './event-notifier';
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { OnEvent } from './on-event';
import Result = NextCall.CallResult;

/**
 * A subset of `AfterEvent` transformation methods inherited from `OnEvent` that return `AfterEvent` registrar
 * instances instead of `OnEvent` ones.
 *
 * This can not be done automatically, as not every transformation results to `EventKeeper`. E.g. when some events
 * are filtered out.
 *
 * An instance of this class can be obtained from `AfterEvent.keep` property.
 */
export class AfterEventKeep<E extends any[]> {

  /**
   * @internal
   */
  private readonly _keeper: AfterEvent<E>;

  constructor(keeper: AfterEvent<E>) {
    this._keeper = keeper;
  }

  /**
   * Extracts event keepers from incoming events.
   *
   * @typeparam F Extracted event type.
   * @param extract A function extracting event keeper from incoming event.
   *
   * @returns An `AfterEvent` registrar of extracted events receivers. The events exhaust once the incoming events do.
   * The returned registrar shares the interest to extracted events among receivers.
   */
  dig<F extends any[]>(extract: (this: void, ...event: E) => EventKeeper<F>): AfterEvent<F> {
    return this.dig_(extract).share();
  }

  /**
   * Extracts event keepers from incoming events.
   *
   * This method does the same as `dig()` one, except it does not share the interest to extracted events among
   * receivers. This may be useful e.g. when the result will be further transformed. It is wise to share the
   * interest to final result in this case.
   *
   * @typeparam F Extracted event type.
   * @param extract A function extracting event keeper from incoming event.
   *
   * @returns An `AfterEvent` registrar of extracted events receivers. The events exhaust once the incoming events do.
   */
  dig_<F extends any[]>(extract: (this: void, ...event: E) => EventKeeper<F>): AfterEvent<F> {
    return afterEventFrom(this._keeper.dig_((...event) => afterEventFrom(extract(...event))));
  }

  thru<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, any, any, any>,
  ): AfterEvent<R1>;

  thru<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): AfterEvent<[R1]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, any, any, any>,
  ): AfterEvent<R2>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
  ): AfterEvent<[R2]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
  ): AfterEvent<R3>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], RE>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => RE,
  ): AfterEvent<[RE]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
  ): AfterEvent<[R4]>;

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
  ): AfterEvent<R5>;

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
  ): AfterEvent<[R5]>;

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
  ): AfterEvent<R6>;

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
  ): AfterEvent<[R6]>;

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
  ): AfterEvent<R7>;

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
  ): AfterEvent<[R7]>;

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
  ): AfterEvent<R8>;

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
  ): AfterEvent<[R8]>;

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
  ): AfterEvent<R9>;

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
  ): AfterEvent<[R9]>;

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
  ): AfterEvent<R10>;

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
  ): AfterEvent<[R10]>;

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
  ): AfterEvent<R11>;

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
  ): AfterEvent<[R11]>;

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
  ): AfterEvent<R12>;

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
  ): AfterEvent<[R12]>;

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
  ): AfterEvent<R13>;

  /**
   * Constructs an `AfterEvent` registrar of original events passed trough the chain of transformations.
   *
   * The passes are preformed by `callThru()` function. The event receivers registered by resulting registrar are called
   * by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An `AfterEvent` registrar of receivers of events transformed with provided passes. The returned registrar
   * shares the interest to transformed events among receivers.
   */
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
  ): AfterEvent<[R13]>;

  thru(...fns: any[]): AfterEvent<any[]> {
    return (this as any).thru_(...fns).share();
  }

  thru_<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, any, any, any>,
  ): AfterEvent<R1>;

  thru_<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): AfterEvent<[R1]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, any, any, any>,
  ): AfterEvent<R2>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
  ): AfterEvent<[R2]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
  ): AfterEvent<R3>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], RE>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => RE,
  ): AfterEvent<[RE]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends Result<P3>,
      P3 extends any[], R3 extends Result<P4>,
      P4 extends any[], R4>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => R2,
      fn3: (this: void, ...args: P3) => R3,
      fn4: (this: void, ...args: P4) => R4,
  ): AfterEvent<[R4]>;

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
  ): AfterEvent<R5>;

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
  ): AfterEvent<[R5]>;

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
  ): AfterEvent<R6>;

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
  ): AfterEvent<[R6]>;

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
  ): AfterEvent<R7>;

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
  ): AfterEvent<[R7]>;

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
  ): AfterEvent<R8>;

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
  ): AfterEvent<[R8]>;

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
  ): AfterEvent<R9>;

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
  ): AfterEvent<[R9]>;

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
  ): AfterEvent<R10>;

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
  ): AfterEvent<[R10]>;

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
  ): AfterEvent<R11>;

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
  ): AfterEvent<[R11]>;

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
  ): AfterEvent<R12>;

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
  ): AfterEvent<[R12]>;

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
  ): AfterEvent<R13>;

  /**
   * Constructs an `OnEvent` registrar of receivers of original events passed trough the chain of transformations
   * without sharing the result.
   *
   * This method does the same as `thru_()` one, except it interest does not share the interest to transformed events
   * among receivers. This may be useful e.g. when the result will be further transformed anyway. It is wise to share
   * the interest to final result in this case.
   *
   * @returns An `OnEvent` registrar of receivers of events transformed with provided passes.
   */
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
  ): AfterEvent<[R13]>;

  thru_(...fns: any[]): AfterEvent<any[]> {
    return afterEventFrom((this._keeper as any).thru_(...fns));
  }

}

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
   * A subset of `AfterEvent` transformation methods inherited from `OnEvent` that return `AfterEvent` registrar
   * instances instead of `OnEvent` ones.
   *
   * Note that not every transformation can properly result to `EventKeeper`. E.g. some events may be filtered out and
   * the resulting `AfterEvent` would rise an exception on receiver registration, as it won't have any event to report.
   */
  get keep(): AfterEventKeep<E> {
    return new AfterEventKeep(this);
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

  let lastEvent: E | undefined;

  class After extends AfterEvent<E> {

    get kept() {
      if (lastEvent) {
        // The last event sent.
        return lastEvent;
      }
      this.once(noop); // Try to receive an event first.
      return last(); // This should return the last event sent, or throw an exception.
    }

  }

  const afterEvent = ((receiver: EventReceiver<E>) => {

    let dest: EventReceiver<E> = noop;
    const interest = register(dispatch);

    if (!interest.done) {
      receiver.apply(
          {
            afterRecurrent(recurrent) {
              dest = recurrent;
            },
          },
          last(),
      );
      dest = receiver;
    }

    return interest;

    function dispatch(this: EventReceiver.Context<E>, ...event: E) {
      lastEvent = event;
      dest.apply(this, event);
    }
  }) as AfterEvent<E>;

  Object.setPrototypeOf(afterEvent, After.prototype);

  return afterEvent;

  function last(): E {
    return lastEvent || (lastEvent = typeof initial === 'function' ? initial() : initial);
  }
}

/**
 * Converts a plain event receiver registration function to `AfterEvent` registrar with a fallback.
 *
 * The event generated by `fallback` will be sent to new receivers unless `register` function send one. It will be
 * returned by `kept` property, unless there are receivers still registered.
 *
 * @typeparam E An event type. This is a list of event receiver parameter types.
 * @param register An event receiver registration function returning an event interest.
 * @param fallback A function creating a fallback event.
 *
 * @returns An `AfterEvent` registrar instance registering event receivers with the given `register` function.
 */
export function afterEventOr<E extends any[]>(
    register: (this: void, receiver: EventReceiver<E>) => EventInterest,
    fallback: (this: void) => E): AfterEvent<E> {

  let lastEvent: E | undefined;
  let numReceivers = 0;

  class AfterOr extends AfterEvent<E> {

    // noinspection JSMethodCanBeStatic
    get kept() {
      return last();
    }

  }

  const afterEvent = ((receiver: EventReceiver<E>) => {

    let dest: EventReceiver<E> = noop;
    const interest = register(dispatch);

    ++numReceivers;

    if (!interest.done) {
      receiver.apply(
          {
            afterRecurrent(recurrent) {
              dest = recurrent;
            },
          },
          last(),
      );
      dest = receiver;
    }

    return interest.whenDone(() => {
      if (!--numReceivers) {
        lastEvent = undefined;
      }
    });

    function dispatch(this: EventReceiver.Context<E>, ...event: E) {
      lastEvent = event;
      dest.apply(this, event);
    }
  }) as AfterEvent<E>;

  Object.setPrototypeOf(afterEvent, AfterOr.prototype);

  return afterEvent;

  function last(): E {
    if (lastEvent) {
      return lastEvent;
    }

    const fb = fallback();

    if (numReceivers) {
      lastEvent = fb;
    }

    return fb;
  }
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

export function afterEventFrom<E extends any[]>(
    senderOrKeeper: EventSender<E> | EventKeeper<E>,
    initial?: ((this: void) => E) | E):
    AfterEvent<E> {
  if (!isEventKeeper(senderOrKeeper)) {
    return afterEventBy(senderOrKeeper[OnEvent__symbol].bind(senderOrKeeper), initial);
  }

  const afterEvent = senderOrKeeper[AfterEvent__symbol];

  // noinspection SuspiciousTypeOfGuard
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
    AfterEvent<[{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }]> {

  // Registering source receivers.
  const keys = Object.keys(sources);

  if (!keys.length) {
    return afterNever;
  }

  return afterEventOr(registerReceiver, latestEvent).share();

  function registerReceiver(receiver: EventReceiver<[{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }]>) {

    const notifier = new EventNotifier<[{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }]>();
    const interest = notifier.on(receiver);
    let send: () => void = noop;
    const result: { [K in keyof S]: EventKeeper.Event<S[K]> } = {} as any;

    keys.forEach(readFrom);

    if (!interest.done) {
      send = () => notifier.send(result);
    }

    return interest;

    function readFrom(key: keyof S) {
      interest.needs(sources[key][AfterEvent__symbol]((...event) => {
        result[key] = event;
        send();
      }).needs(interest));
    }
  }

  function latestEvent(): [{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }] {

    const result: { [K in keyof S]: EventKeeper.Event<S[K]> } = {} as any;

    keys.forEach(key =>
        afterEventFrom(sources[key])
            .once((...event) => result[key as keyof S] = event));

    return [result];
  }
}
