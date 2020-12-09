/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/call-thru
 */
import { shareEvents } from '../actions';
import { AfterEvent, afterEventBy } from '../after-event';
import { OnEventCallChain } from './on-event-call-chain';
import { thru } from './thru.impl';
import Args = OnEventCallChain.Args;
import Out = OnEventCallChain.Out;

/**
 * Creates a transformer of events incoming from {@link AfterEvent} keeper.
 *
 * Transformations performed by `@proc7ts/call-thru` library. The event receivers registered by resulting event keeper
 * are called by the last pass in chain. Thus the events can be e.g. sent multiple times.
 *
 * The transformer does the same as the one created by {@link thruOn} one, but returns an {@link AfterEvent} keeper
 * instead of {@link OnEvent} sender. This can not be always done, as not every transformation results
 * to {@link EventKeeper}. E.g. when some events filtered out.
 *
 * @category Core
 * @typeParam TInEvent - A type of incoming events to transform.
 * @typeParam TReturn1 A type of outgoing transformed events.
 *
 * @returns An event keeper transformer function.
 */
export function thruAfter<
    TEvent extends any[],
    TReturn1,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn1>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn2>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    TArgs11 extends Args<TReturn10>, TReturn11,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
    pass11: (this: void, ...args: TArgs11) => TReturn11,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    TArgs11 extends Args<TReturn10>, TReturn11,
    TArgs12 extends Args<TReturn11>, TReturn12,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
    pass11: (this: void, ...args: TArgs11) => TReturn11,
    pass12: (this: void, ...args: TArgs12) => TReturn12,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    TArgs11 extends Args<TReturn10>, TReturn11,
    TArgs12 extends Args<TReturn11>, TReturn12,
    TArgs13 extends Args<TReturn12>, TReturn13,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
    pass11: (this: void, ...args: TArgs11) => TReturn11,
    pass12: (this: void, ...args: TArgs12) => TReturn12,
    pass13: (this: void, ...args: TArgs13) => TReturn13,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter<TEvent extends any[], TReturn extends any[]>(
    ...passes: ((...args: any[]) => any)[]
): (this: void, supplier: AfterEvent<TEvent>) => AfterEvent<TReturn> {

  const map = (
      thruAfter_ as unknown as (
          ...passes: ((...args: any[]) => any)[]
      ) => (
          supplier: AfterEvent<TEvent>,
      ) => AfterEvent<TReturn>
  )(...passes);

  return input => shareEvents(map(input));
}

/**
 * Creates a transformer of events incoming from {@link AfterEvent} keeper that does not share the outgoing events
 * supply.
 *
 * Transformations performed by `@proc7ts/call-thru` library. The event receivers registered by resulting event keeper
 * are called by the last pass in chain. Thus the events can be e.g. sent multiple times.
 *
 * The transformer does the same as the one created by {@link thruOn_} one, but returns an {@link AfterEvent} keeper
 * instead of {@link OnEvent} sender. This can not be always done, as not every transformation results
 * to {@link EventKeeper}. E.g. when some events filtered out.
 *
 * @category Core
 * @typeParam TInEvent - A type of incoming events to transform.
 * @typeParam TReturn1 A type of outgoing transformed events.
 *
 * @returns An event sender transformer function.
 */
export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn1>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn2>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    TArgs11 extends Args<TReturn10>, TReturn11,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
    pass11: (this: void, ...args: TArgs11) => TReturn11,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    TArgs11 extends Args<TReturn10>, TReturn11,
    TArgs12 extends Args<TReturn11>, TReturn12,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
    pass11: (this: void, ...args: TArgs11) => TReturn11,
    pass12: (this: void, ...args: TArgs12) => TReturn12,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn1,
    TArgs2 extends Args<TReturn1>, TReturn2,
    TArgs3 extends Args<TReturn2>, TReturn3,
    TArgs4 extends Args<TReturn3>, TReturn4,
    TArgs5 extends Args<TReturn4>, TReturn5,
    TArgs6 extends Args<TReturn5>, TReturn6,
    TArgs7 extends Args<TReturn6>, TReturn7,
    TArgs8 extends Args<TReturn7>, TReturn8,
    TArgs9 extends Args<TReturn8>, TReturn9,
    TArgs10 extends Args<TReturn9>, TReturn10,
    TArgs11 extends Args<TReturn10>, TReturn11,
    TArgs12 extends Args<TReturn11>, TReturn12,
    TArgs13 extends Args<TReturn12>, TReturn13,
    >(
    pass1: (this: void, ...args: TEvent) => TReturn1,
    pass2: (this: void, ...args: TArgs2) => TReturn2,
    pass3: (this: void, ...args: TArgs3) => TReturn3,
    pass4: (this: void, ...args: TArgs4) => TReturn4,
    pass5: (this: void, ...args: TArgs5) => TReturn5,
    pass6: (this: void, ...args: TArgs6) => TReturn6,
    pass7: (this: void, ...args: TArgs7) => TReturn7,
    pass8: (this: void, ...args: TArgs8) => TReturn8,
    pass9: (this: void, ...args: TArgs9) => TReturn9,
    pass10: (this: void, ...args: TArgs10) => TReturn10,
    pass11: (this: void, ...args: TArgs11) => TReturn11,
    pass12: (this: void, ...args: TArgs12) => TReturn12,
    pass13: (this: void, ...args: TArgs13) => TReturn13,
): (this: void, input: AfterEvent<TEvent>) => AfterEvent<Out<TReturn3>>;

export function thruAfter_<// eslint-disable-line @typescript-eslint/naming-convention
    TEvent extends any[],
    TReturn extends any[],
    >(
    ...passes: ((...args: any[]) => any)[]
): (this: void, supplier: AfterEvent<TEvent>) => AfterEvent<TReturn> {
  return (input): AfterEvent<any> => afterEventBy(thru(input, passes));
}
