/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop, Supply, SupplyPeer } from '@proc7ts/primitives';
import { AfterEvent__symbol, EventKeeper, eventReceiver, EventReceiver } from './base';
import { share, thru, tillOff } from './impl';
import { OnEvent } from './on-event';
import { OnEventCallChain } from './passes';
import Args = OnEventCallChain.Args;
import Out = OnEventCallChain.Out;

function noEvent(): never {
  throw new Error('No events to send');
}

/**
 * An {@link EventKeeper} implementation able to register the receivers of kept and upcoming events.
 *
 * The registered event receiver receives the kept event immediately upon registration, and all upcoming events
 * after that until the returned event supply is cut off.
 *
 * To convert a plain event receiver registration function to {@link AfterEvent} an {@link afterEventBy} function can
 * be used.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export class AfterEvent<TEvent extends any[]> extends OnEvent<TEvent> implements EventKeeper<TEvent> {

  /**
   * @internal
   */
  private _last?: TEvent;

  /**
   * @internal
   */
  private _rcn = 0;

  /**
   * @internal
   */
  private readonly _or: (this: void) => TEvent;

  /**
   * Constructs {@link AfterEvent} instance.
   *
   * The event constructed by `or` will be sent to the registered first receiver, unless `register` function sends one.
   *
   * @param on - Generic event receiver registration function. It will be called on each receiver registration,
   * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
   * @param or - A function creating fallback event. When omitted, the initial event is expected to be sent by
   * `register` function. A receiver registration would lead to an error otherwise.
   */
  constructor(
      on: (this: void, receiver: EventReceiver.Generic<TEvent>) => void,
      or: (this: void) => TEvent = noEvent,
  ) {
    super(on);
    this._or = or;
  }

  /**
   * Event receiver registration function of this event keeper.
   *
   * Delegates to {@link AfterEvent.to} method.
   */
  get F(): AfterEvent.Fn<TEvent> {
    return this.to.bind(this);
  }

  [AfterEvent__symbol](): this {
    return this;
  }

  /**
   * Converts a plain event receiver registration function to {@link AfterEvent} keeper with a fallback.
   *
   * The event constructed by `fallback` will be sent to the registered first receiver, unless `register` function sends
   * one.
   *
   * @typeParam TNewEvent - An event type. This is a list of event receiver parameter types.
   * @param register - Generic event receiver registration function. It will be called on each receiver registration,
   * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
   * @param fallback - A function creating fallback event. When omitted, the initial event is expected to be sent by
   * `register` function. A receiver registration would lead to an error otherwise.
   *
   * @returns An {@link AfterEvent} keeper registering event receivers with the given `register` function.
   */
  by<TNewEvent extends any[]>(
      register: (this: void, receiver: EventReceiver.Generic<TNewEvent>) => void,
  ): AfterEvent<TNewEvent> {
    return new AfterEvent(register);
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
   * @returns A supply of events from this keeper to the given `receiver`.
   */
  to(receiver: EventReceiver<TEvent>): Supply;

  /**
   * Either starts sending events to the given `receiver`, or returns a reference to itself.
   *
   * @param receiver - Target receiver of events.
   *
   * @returns Either a supply of events from this keeper to the given `receiver`, or `this` instance when `receiver`
   * is omitted.
   */
  to(receiver?: EventReceiver<TEvent>): this | Supply;

  to(receiver?: EventReceiver<TEvent>): this | Supply {
    if (!receiver) {
      return this;
    }

    let dest: (context: EventReceiver.Context<TEvent>, ...event: TEvent) => void = noop;
    const generic = eventReceiver(receiver);

    if (generic.supply.isOff) {
      return generic.supply;
    }

    const supply = new Supply().needs(generic.supply);
    let reported = false;

    this._on({
      supply,
      receive: (context, ...event: TEvent) => {
        reported = true;
        this._last = event;
        dest(context, ...event);
      },
    });
    ++this._rcn;

    if (!supply.isOff || reported) {
      generic.receive(
          {
            onRecurrent(recurrent) {
              dest = (_context, ...event) => recurrent(...event);
            },
          },
          ...(this._last || (this._last = this._or())),
      );
      dest = (context, ...event) => generic.receive(context, ...event);
    }

    supply.whenOff(reason => {
      if (!--this._rcn) {
        this._last = undefined;
      }
      generic.supply.off(reason);
    });

    return supply;
  }

  /**
   * Builds an {@link AfterEvent} keeper that sends events from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param required - A peer of required event supply.
   * @param dependentSupply - The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New event keeper.
   */
  tillOff(required: SupplyPeer, dependentSupply?: Supply): AfterEvent<TEvent> {
    return afterEventBy(tillOff(this, required, dependentSupply));
  }

  /**
   * Constructs an {@link AfterEvent} keeper of original events passed trough the chain of transformations.
   *
   * This does the same as {@link thru} method, but return {@link AfterEvent} keeper instead of {@link OnEvent} sender.
   * This can not be done automatically, as not every transformation results to {@link EventKeeper}.
   * E.g. when some events filtered out.
   *
   * The passes are preformed by `@proc7ts/call-thru` library. The event receivers registered by resulting event keeper
   * are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An {@link AfterEvent} keeper of events transformed with provided passes. The returned keeper shares
   * the supply of transformed events among receivers.
   */
  keepThru<
      TReturn1,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
  ): AfterEvent<Out<TReturn1>>;

  keepThru<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
  ): AfterEvent<Out<TReturn2>>;

  keepThru<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      TArgs4 extends Args<TReturn3>, TReturn4,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
      pass4: (this: void, ...args: TArgs4) => TReturn4,
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru(...passes: any[]): AfterEvent<any[]> {
    // eslint-disable-next-line
    return afterEventBy(share((this as any).keepThru_(...passes)));
  }

  /**
   * Constructs an {@link AfterEvent} keeper of original events passed trough the chain of transformations without
   * sharing the transformed events supply.
   *
   * This method does the same as {@link AfterEvent.keepThru} one, except it does not share the supply of transformed
   * events among receivers. This may be useful e.g. when the result will be further transformed anyway.
   * It is wise to {@link shareEvents share} the supply of events from final result in this case.
   *
   * @returns An {@link AfterEvent} keeper of events transformed with provided passes.
   */
  keepThru_<
      TReturn1,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
  ): AfterEvent<Out<TReturn1>>;

  keepThru_<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
  ): AfterEvent<Out<TReturn2>>;

  keepThru_<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
      TReturn1,
      TArgs2 extends Args<TReturn1>, TReturn2,
      TArgs3 extends Args<TReturn2>, TReturn3,
      TArgs4 extends Args<TReturn3>, TReturn4,
      >(
      pass1: (this: void, ...args: TEvent) => TReturn1,
      pass2: (this: void, ...args: TArgs2) => TReturn2,
      pass3: (this: void, ...args: TArgs3) => TReturn3,
      pass4: (this: void, ...args: TArgs4) => TReturn4,
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_<
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
  ): AfterEvent<Out<TReturn3>>;

  keepThru_(...passes: any[]): AfterEvent<any[]> {
    return afterEventBy(thru(this, passes as any));
  }

}

export namespace AfterEvent {

  /**
   * A signature of function registering receivers of events sent by event keeper.
   *
   * When called without parameters it returns an {@link AfterEvent} keeper. When called with event receiver as
   * parameter it returns a supply of events from that keeper.
   *
   * Available as {@link AfterEvent.F} property value.
   *
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export type Fn<TEvent extends any[]> = Method<void, TEvent>;

  /**
   * A signature of method registering receivers of events sent by event keeper.
   *
   * When called without parameters it returns an {@link AfterEvent} keeper. When called with event receiver as
   * parameter it returns a supply of events from that keeper.
   *
   * @typeParam TThis - `this` context type.
   * @typeParam TEvent - An event type. This is a tuple of event receiver parameter types.
   */
  export interface Method<TThis, TEvent extends any[]> {

    /**
     * Returns the event keeper.
     *
     * @returns {@link AfterEvent} keeper the events originated from.
     */
    (
        this: TThis,
    ): AfterEvent<TEvent>;

    /**
     * Registers a receiver of events sent by the keeper.
     *
     * @param receiver - A receiver of events to register.
     *
     * @returns A supply of events from the keeper to the given `receiver`.
     */
    (
        this: TThis,
        receiver: EventReceiver<TEvent>,
    ): Supply;

    /**
     * Either registers a receiver of events sent by the keeper, or returns the keeper itself.
     *
     * @param receiver - A receiver of events to register.
     *
     * @returns Either a supply of events from the keeper to the given `receiver`, or {@link AfterEvent} keeper
     * the events originated from when `receiver` is omitted.
     */
    (
        this: TThis,
        receiver?: EventReceiver<TEvent>,
    ): Supply | AfterEvent<TEvent>;
  }

}

/**
 * Converts a plain event receiver registration function to {@link AfterEvent} keeper with a fallback.
 *
 * The event constructed by `fallback` will be sent to the registered first receiver, unless `register` function sends
 * one.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param register - Generic event receiver registration function. It will be called on each receiver registration,
 * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
 * @param fallback - A function creating fallback event. When omitted, the initial event is expected to be sent by
 * `register` function. A receiver registration would lead to an error otherwise.
 *
 * @returns An {@link AfterEvent} keeper registering event receivers with the given `register` function.
 */
export function afterEventBy<TEvent extends any[]>(
    register: (this: void, receiver: EventReceiver.Generic<TEvent>) => void,
    fallback?: (this: void) => TEvent,
): AfterEvent<TEvent> {
  return new AfterEvent(register, fallback);
}
