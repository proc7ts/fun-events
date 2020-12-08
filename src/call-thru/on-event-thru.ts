/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/call-thru
 */
import { OnEvent } from '../on-event';
import { OnEventCallChain } from './on-event-call-chain';
import Args = OnEventCallChain.Args;
import Out = OnEventCallChain.Out;

/**
 * A transformer of event sender.
 *
 * Constructed by {@link thruOn} function and can be used to transform events.
 *
 * @typeParam TEvent - A type of events to transform.
 */
export interface OnEventThru<TEvent extends any[]> {

  /**
   * Creates an {@link OnEvent} sender of events passed trough the chain of transformations.
   *
   * Transformations performed by `@proc7ts/call-thru` library. The event receivers registered by resulting event sender
   * are called by the last pass in chain. Thus the events can be e.g. filtered out or called multiple times.
   *
   * @returns An {@link OnEvent} sender of events transformed with provided passes. The returned sender shares
   * the supply of transformed events among receivers.
   */
  forAll<
      TReturn1,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
  ): OnEvent<Out<TReturn1>>;

  forAll<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
  ): OnEvent<Out<TReturn2>>;

  forAll<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
  ): OnEvent<Out<TReturn3>>;

  forAll<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      TArgs4 extends Args<TReturn3>, TReturn4,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
      pass4: (this: void, ...args: TArgs4) => TReturn4,
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  forAll<
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
  ): OnEvent<Out<TReturn3>>;

  /**
   * Creates an {@link OnEvent} sender of events passed trough the chain of transformations without sharing
   * the transformed events supply.
   *
   * This method does the same as {@link forAll} one, except it does not share the supply of transformed events among
   * receivers. This may be useful e.g. when the result will be further transformed anyway. It is wise to
   * {@link shareEvents share} the supply of events from final result in this case.
   *
   * @returns An {@link OnEvent} sender of events transformed with provided passes.
   */
  forEach<
      TReturn1,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
  ): OnEvent<Out<TReturn1>>;

  forEach<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
  ): OnEvent<Out<TReturn2>>;

  forEach<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
  ): OnEvent<Out<TReturn3>>;

  forEach<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      TArgs4 extends Args<TReturn3>, TReturn4,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
      pass4: (this: void, ...args: TArgs4) => TReturn4,
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

  forEach<
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
  ): OnEvent<Out<TReturn3>>;

}
