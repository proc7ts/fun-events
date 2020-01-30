/**
 * @packageDocumentation
 * @module fun-events
 */
import { NextCall, noop, valueProvider } from 'call-thru';
import { AfterEvent__symbol, EventKeeper, isEventKeeper } from './event-keeper';
import { eventReceiver, EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { EventSupplier } from './event-supplier';
import { EventSupply, eventSupply } from './event-supply';
import { once, share, tillOff } from './impl';
import { OnEvent } from './on-event';
import Result = NextCall.CallResult;

/**
 * A subset of [[AfterEvent]] transformation methods inherited that return [[AfterEvent]] keepers instead of
 * [[OnEvent]] senders.
 *
 * This can not be done automatically, as not every transformation results to [[EventKeeper]]. E.g. when some events
 * are filtered out.
 *
 * An instance of this class can be obtained from [[AfterEvent.keep]] property.
 *
 * @category Core
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
   * @typeparam F  Extracted event type.
   * @param extract  A function extracting event keeper from incoming event.
   *
   * @returns An [[AfterEvent]] keeper of extracted events. The events supply is cut off once the incoming events supply
   * do. The returned keeper shares the supply of extracted events among receivers.
   */
  dig<F extends any[]>(extract: (this: void, ...event: E) => EventKeeper<F>): AfterEvent<F> {
    return this.dig_(extract).share();
  }

  /**
   * Extracts event keepers from incoming events without sharing extracted events supply.
   *
   * This method does the same as [[AfterEventKeep.dig]] one, except it does not share the supply of extracted events
   * among receivers. This may be useful e.g. when the result will be further transformed. It is wise to
   * {@link AfterEvent.share share} the supply of events from the final result in this case.
   *
   * @typeparam F  Extracted event type.
   * @param extract  A function extracting event keeper from incoming event.
   *
   * @returns An [[AfterEvent]] keeper of extracted events. The events supply is cut off once the incoming events
   * supply do.
   */
  dig_<F extends any[]>(extract: (this: void, ...event: E) => EventKeeper<F>): AfterEvent<F> {
    return afterSupplied(this._keeper.dig_((...event) => afterSupplied(extract(...event))));
  }

  /**
   * Constructs an [[AfterEvent]] keeper of original events passed trough the chain of transformations.
   *
   * The passes are preformed by `callThru()` function. The event receivers registered by resulting event keeper
   * are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An [[AfterEvent]] keeper of events transformed with provided passes. The returned keeper shares the supply
   * of transformed events among receivers.
   */
  thru<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, void, void, void>,
  ): AfterEvent<R1>;

  thru<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): AfterEvent<[R1]>;

  thru<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, void, void, void>,
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
      fn5: (this: void, ...args: P5) => NextCall<any, R5, void, void, void>,
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
      fn6: (this: void, ...args: P6) => NextCall<any, R6, void, void, void>,
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
      fn7: (this: void, ...args: P7) => NextCall<any, R7, void, void, void>,
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
      fn8: (this: void, ...args: P8) => NextCall<any, R8, void, void, void>,
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
      fn9: (this: void, ...args: P9) => NextCall<any, R9, void, void, void>,
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
      fn10: (this: void, ...args: P10) => NextCall<any, R10, void, void, void>,
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
      fn11: (this: void, ...args: P11) => NextCall<any, R11, void, void, void>,
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
      fn12: (this: void, ...args: P12) => NextCall<any, R12, void, void, void>,
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
      fn13: (this: void, ...args: P13) => NextCall<any, R13, void, void, void>,
  ): AfterEvent<R13>;

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

  /**
   * Constructs an [[AfterEvent]] keeper of original events passed trough the chain of transformations without sharing
   * the transformed events supply.
   *
   * This method does the same as [[AfterEventKeep.thru]] one, except it does not share the supply of transformed
   * events among receivers. This may be useful e.g. when the result will be further transformed anyway.
   * It is wise to {@link AfterEvent.share share} the supply of events from final result in this case.
   *
   * @returns An [[AfterEvent]] keeper of events transformed with provided passes.
   */
  thru_<R1 extends any[]>(
      fn1: (this: void, ...args: E) => NextCall<any, R1, void, void, void>,
  ): AfterEvent<R1>;

  thru_<R1>(
      fn1: (this: void, ...args: E) => R1,
  ): AfterEvent<[R1]>;

  thru_<
      R1 extends Result<P2>,
      P2 extends any[], R2 extends any[]>(
      fn1: (this: void, ...args: E) => R1,
      fn2: (this: void, ...args: P2) => NextCall<any, R2, void, void, void>,
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
      fn5: (this: void, ...args: P5) => NextCall<any, R5, void, void, void>,
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
      fn6: (this: void, ...args: P6) => NextCall<any, R6, void, void, void>,
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
      fn7: (this: void, ...args: P7) => NextCall<any, R7, void, void, void>,
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
      fn8: (this: void, ...args: P8) => NextCall<any, R8, void, void, void>,
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
      fn9: (this: void, ...args: P9) => NextCall<any, R9, void, void, void>,
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
      fn10: (this: void, ...args: P10) => NextCall<any, R10, void, void, void>,
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
      fn11: (this: void, ...args: P11) => NextCall<any, R11, void, void, void>,
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
      fn12: (this: void, ...args: P12) => NextCall<any, R12, void, void, void>,
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
      fn13: (this: void, ...args: P13) => NextCall<any, R13, void, void, void>,
  ): AfterEvent<R13>;

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
    return afterSupplied((this._keeper as any).thru_(...fns));
  }

}

/**
 * A kept and upcoming events receiver registration function interface.
 *
 * A registered event receiver would receive the kept event immediately upon registration, and all upcoming events
 * after that.
 *
 * To convert a plain event receiver registration function to [[AfterEvent]] an [[afterEventBy]] function can be used.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export abstract class AfterEvent<E extends any[]> extends OnEvent<E> implements EventKeeper<E> {

  get [AfterEvent__symbol](): this {
    return this;
  }

  /**
   * A subset of [[AfterEvent]] transformation methods that return [[AfterEvent]] keepers instead of [[OnEvent]]
   * senders.
   *
   * Note that not every transformation can properly result to [[EventKeeper]]. E.g. some events may be filtered out and
   * the resulting [[AfterEvent]] would rise an exception on receiver registration, as it won't have any events to send.
   */
  get keep(): AfterEventKeep<E> {
    return new AfterEventKeep(this);
  }

  /**
   * An [[AfterEvent]] keeper derived from this one that sends currently the kept event to registered receiver
   * and stops sending them after that.
   */
  get once(): AfterEvent<E> {
    return afterEventBy(once(this));
  }

  /**
   * Builds an [[AfterEvent]] keeper that sends events from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param requiredSupply  The required event supply.
   * @param dependentSupply  The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New event keeper.
   */
  tillOff(requiredSupply: EventSupply, dependentSupply?: EventSupply): AfterEvent<E> {
    return afterEventBy(tillOff(this, requiredSupply, dependentSupply));
  }

  /**
   * Constructs an [[AfterEvent]] keeper that shares events supply among all registered receivers.
   *
   * The created keeper receives events from this one and sends to registered receivers. The shared keeper registers
   * a receiver in this one only once, when first receiver registered. And cuts off original events supply once all
   * event supplies do.
   *
   * @returns An [[AfterEvent]] keeper sharing a common supply of events originating from this keeper.
   */
  share(): AfterEvent<E> {
    return afterEventBy(share(this));
  }

}

/**
 * Converts a plain event receiver registration function to [[AfterEvent]] keeper with a fallback.
 *
 * The event generated by `fallback` will be sent to the registered first receiver, unless `register` function sends
 * one.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param register  Generic event receiver registration function. It will be called on each receiver registration,
 * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
 * @param fallback  A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns An [[AfterEvent]] keeper registering event receivers with the given `register` function.
 */
export function afterEventBy<E extends any[]>(
    register: (this: void, receiver: EventReceiver.Generic<E>) => void,
    fallback: (this: void) => E = noEvent,
): AfterEvent<E> {

  let lastEvent: E | undefined;
  let numReceivers = 0;

  const afterEvent = ((receiver: EventReceiver<E>) => {

    let dest: (context: EventReceiver.Context<E>, ...event: E) => void = noop;
    const generic = eventReceiver(receiver);

    if (generic.supply.isOff) {
      return generic.supply;
    }

    const supply = eventSupply().needs(generic.supply);
    let reported = false;

    register({
      supply,
      receive(context, ...event: E) {
        reported = true;
        lastEvent = event;
        dest(context, ...event);
      },
    });
    ++numReceivers;

    if (!supply.isOff || reported) {
      generic.receive(
          {
            onRecurrent(recurrent) {
              dest = (_context, ...event) => recurrent(...event);
            },
          },
          ...(lastEvent || (lastEvent = fallback())),
      );
      dest = (context, ...event) => generic.receive(context, ...event);
    }

    supply.whenOff(reason => {
      if (!--numReceivers) {
        lastEvent = undefined;
      }
      generic.supply.off(reason);
    });

    return supply;
  }) as AfterEvent<E>;

  Object.setPrototypeOf(afterEvent, AfterEvent.prototype);

  return afterEvent;
}

/**
 * Builds an [[AfterEvent]] keeper of events sent by the given `keeper`.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param keeper  A keeper of events.
 *
 * @returns An [[AfterEvent]] keeper of events originated from the given `keeper`.
 */
export function afterSupplied<E extends any[]>(keeper: EventKeeper<E>): AfterEvent<E>;

/**
 * Builds an [[AfterEvent]] keeper of events sent by the given `sender`.
 *
 * The event generated by `fallback` will be sent to the registered first receiver, unless `register` function sends
 * one.
 *
 * This is a synonym of [[afterSent]], unless `sender` is an [[EventKeeper]].
 *
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param sender  An event sender.
 * @param fallback  A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns An [[AfterEvent]] keeper of events either originated from the given `sender`, or `initial` one.
 */
export function afterSupplied<E extends any[]>(
    sender: EventSender<E>,
    fallback?: (this: void) => E,
): AfterEvent<E>;

export function afterSupplied<E extends any[]>(
    supplier: EventSupplier<E>,
    fallback?: (this: void) => E,
): AfterEvent<E> {
  if (!isEventKeeper(supplier)) {
    return afterSent(supplier, fallback);
  }

  const afterEvent = supplier[AfterEvent__symbol];

  if (afterEvent instanceof AfterEvent) {
    return afterEvent;
  }

  return afterEventBy(afterEvent.bind(supplier));
}

/**
 * Builds an [[AfterEvent]] keeper of events sent by the given `sender`.
 *
 * The event generated by `fallback` will be sent to the registered first receiver, unless `register` function sends
 * one.
 *
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param sender  An event sender.
 * @param fallback  A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns An [[AfterEvent]] keeper of events either originated from the given `sender`, or `initial` one.
 */
export function afterSent<E extends any[]>(
    sender: EventSender<E>,
    fallback?: (this: void) => E,
): AfterEvent<E> {
  return afterEventBy(receiver => sender[OnEvent__symbol](receiver), fallback);
}

/**
 * Builds an [[AfterEvent]] keeper of the given `event`.
 *
 * @category Core
 * @param event  An event that will be sent to all receivers upon registration.
 *
 * @returns An [[AfterEvent]] keeper that always sends the given `event`.
 */
export function afterThe<E extends any[]>(...event: E): AfterEvent<E> {
  return afterEventBy(() => eventSupply(), valueProvider(event));
}

/**
 * An [[AfterEvent]] keeper that never sends any events.
 *
 * @category Core
 */
export const afterNever: AfterEvent<any> = (/*#__PURE__*/ afterEventBy(({ supply }) => supply.off()));

function noEvent(): never {
  throw new Error('No events to send');
}
