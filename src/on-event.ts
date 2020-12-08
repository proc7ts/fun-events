/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { eventReceiver, EventReceiver, EventSender, OnEvent__symbol } from './base';
import { share, then, thru, tillOff } from './impl';
import { OnEventCallChain } from './passes';
import Args = OnEventCallChain.Args;
import Out = OnEventCallChain.Out;

/**
 * An {@link EventSender} implementation able to register event receivers.
 *
 * The registered event receiver starts receiving upcoming events until the returned event supply is cut off.
 *
 * Contains additional event processing methods.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export class OnEvent<TEvent extends any[]> implements EventSender<TEvent> {

  /**
   * Generic event receiver registration function. It will be called on each receiver registration,
   * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
   */
  protected readonly _on: (receiver: EventReceiver.Generic<TEvent>) => void;

  /**
   * Constructs {@link OnEvent} instance.
   *
   * @param on - Generic event receiver registration function. It will be called on each receiver registration,
   * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
   */
  constructor(on: (receiver: EventReceiver.Generic<TEvent>) => void) {
    this._on = on;
  }

  /**
   * Event receiver registration function of this sender.
   *
   * Delegates to {@link OnEvent.to} method.
   */
  get F(): OnEvent.Fn<TEvent> {
    return this.to.bind(this);
  }

  [OnEvent__symbol](): this {
    return this;
  }

  /**
   * Converts a plain event receiver registration function to {@link OnEvent} sender.
   *
   * @typeParam TNewEvent - An event type. This is a list of event receiver parameter types.
   * @param register - Generic event receiver registration function. It will be called on each receiver registration,
   * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
   *
   * @returns An {@link OnEvent} sender registering event receivers with the given `register` function.
   */
  by<TNewEvent extends any[]>(
      register: (this: void, receiver: EventReceiver.Generic<TNewEvent>) => void,
  ): OnEvent<TNewEvent> {
    return new OnEvent(register);
  }

  /**
   * Applies the given action to this event supplier.
   *
   * @typeParam TOut - Action result type.
   * @typeParam TArgs - Action parameters type.
   * @param action - A function accepting this sender as its first parameter, and the given arguments as the rest of
   * them.
   * @param args - Arguments to pass to action function.
   *
   * @returns Action result.
   */
  do<TOut, TArgs extends any[] = []>(
      action: (this: void, onEvent: this, ...args: TArgs) => TOut,
      ...args: TArgs
  ): TOut {
    return action(this, ...args);
  }

  /**
   * Returns a reference to itself.
   *
   * @returns `this` instance.
   */
  to(): this;

  /**
   * Starts sending events to the given `receiver`.
   *
   * @param receiver - Target receiver of events.
   *
   * @returns A supply of events from this sender to the given `receiver`.
   */
  to(receiver: EventReceiver<TEvent>): Supply;

  /**
   * Either starts sending events to the given `receiver`, or returns a reference to itself.
   *
   * @param receiver - Target receiver of events.
   *
   * @returns Either a supply of events from this sender to the given `receiver`, or `this` instance when `receiver`
   * is omitted.
   */
  to(receiver?: EventReceiver<TEvent>): this | Supply;

  to(receiver?: EventReceiver<TEvent>): this | Supply {
    if (!receiver) {
      return this;
    }

    const generic = eventReceiver(receiver);
    const { supply } = generic;

    if (!supply.isOff) {
      this._on(generic);
    }

    return supply;
  }

  /**
   * Attaches callbacks to the next event and/or supply cut off reason.
   *
   * This method makes event sender act as promise-like for the first parameter of the next event. Thus it is possible
   * e.g. to use it in `await` expression.
   *
   * @param onEvent - The callback to execute when next event received.
   * @param onCutOff - The callback to execute when supply is cut off before the next event received.
   *
   * @returns A Promise for the next event.
   */
  then<TResult1 = TEvent extends [infer F, ...any[]] ? F : undefined, TResult2 = never>(
      onEvent?: ((...event: TEvent) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onCutOff?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return then(this, onEvent, onCutOff);
  }

  /**
   * Builds an {@link OnEvent} sender that sends events from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param required - A peer of required event supply.
   * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New event sender.
   */
  tillOff(required: SupplyPeer, dependentSupply?: Supply): OnEvent<TEvent> {
    return onEventBy(tillOff(this, required, dependentSupply));
  }

  /**
   * Constructs an {@link OnEvent} sender of original events passed trough the chain of transformations.
   *
   * The passes are preformed by `@proc7ts/call-thru` library. The event receivers registered by resulting event sender
   * are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An {@link OnEvent} sender of events transformed with provided passes. The returned sender shares
   * the supply of transformed events among receivers.
   */
  thru<
      TReturn1,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
  ): OnEvent<Out<TReturn1>>;

  thru<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
  ): OnEvent<Out<TReturn2>>;

  thru<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
  ): OnEvent<Out<TReturn3>>;

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru<
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

  thru(...passes: any[]): OnEvent<any[]> {
    // eslint-disable-next-line
    return onEventBy(share((this as any).thru_(...passes)));
  }

  /**
   * Constructs an {@link OnEvent} sender of original events passed trough the chain of transformations without sharing
   * the transformed events supply.
   *
   * This method does the same as {@link OnEvent.thru} one, except it does not share the supply of transformed events
   * among receivers. This may be useful e.g. when the result will be further transformed anyway. It is wise to
   * {@link share share} the supply of events from final result in this case.
   *
   * @returns An {@link OnEvent} sender of events transformed with provided passes.
   */
  thru_<
      TReturn1,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
  ): OnEvent<Out<TReturn1>>;

  thru_<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
  ): OnEvent<Out<TReturn2>>;

  thru_<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
  ): OnEvent<Out<TReturn3>>;

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_<
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

  thru_(...passes: any[]): OnEvent<any[]> {
    return onEventBy(thru(this, passes));
  }

}

export namespace OnEvent {

  /**
   * A signature of function registering receivers of events sent by event sender.
   *
   * When called without parameters it returns an {@link OnEvent} sender. When called with event receiver as parameter
   * it returns a supply of events from that sender.
   *
   * Available as {@link OnEvent.F} property value.
   *
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export type Fn<TEvent extends any[]> = Method<void, TEvent>;

  /**
   * A signature of method registering receivers of events sent by event sender.
   *
   * When called without parameters it returns an {@link OnEvent} sender. When called with event receiver as parameter
   * it returns a supply of events from that sender.
   *
   * @typeParam TThis - `this` context type.
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export interface Method<TThis, TEvent extends any[]> {

    /**
     * Returns the event sender.
     *
     * @returns {@link OnEvent} sender the events originated from.
     */
    (
        this: TThis,
    ): OnEvent<TEvent>;

    /**
     * Registers a receiver of events sent by the sender.
     *
     * @param receiver - A receiver of events to register.
     *
     * @returns A supply of events from the sender to the given `receiver`.
     */
    (
        this: TThis,
        receiver: EventReceiver<TEvent>,
    ): Supply;

    /**
     * Either registers a receiver of events sent by the sender, or returns the sender itself.
     *
     * @param receiver - A receiver of events to register.
     *
     * @returns Either a supply of events from the sender to the given `receiver`, or {@link OnEvent} sender the events
     * originated from when `receiver` is omitted.
     */
    (
        this: TThis,
        receiver?: EventReceiver<TEvent>,
    ): Supply | OnEvent<TEvent>;

  }

}

/**
 * Converts a plain event receiver registration function to {@link OnEvent} sender.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param register - Generic event receiver registration function. It will be called on each receiver registration,
 * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
 *
 * @returns An {@link OnEvent} sender registering event receivers with the given `register` function.
 */
export function onEventBy<TEvent extends any[]>(
    register: (this: void, receiver: EventReceiver.Generic<TEvent>) => void,
): OnEvent<TEvent> {
  return new OnEvent(register);
}
