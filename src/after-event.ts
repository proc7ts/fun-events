/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop } from '@proc7ts/primitives';
import {
  AfterEvent__symbol,
  EventKeeper,
  eventReceiver,
  EventReceiver,
  EventSupply,
  eventSupply,
  EventSupplyPeer,
} from './base';
import { once, share, thru, tillOff } from './impl';
import { OnEvent } from './on-event';
import { OnEventCallChain } from './passes';
import Args = OnEventCallChain.Args;
import Out = OnEventCallChain.Out;

function noEvent(): never {
  throw new Error('No events to send');
}

/**
 * An [[EventKeeper]] implementation able to register the receivers of kept and upcoming events.
 *
 * The registered event receiver receives the kept event immediately upon registration, and all upcoming events
 * after that until the returned event supply is cut off.
 *
 * To convert a plain event receiver registration function to [[AfterEvent]] an [[afterEventBy]] function can be used.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export class AfterEvent<E extends any[]> extends OnEvent<E> implements EventKeeper<E> {

  /**
   * @internal
   */
  private _last?: E;

  /**
   * @internal
   */
  private _rcn = 0;

  /**
   * @internal
   */
  private readonly _or: (this: void) => E;

  /**
   * Constructs [[AfterEvent]] instance.
   *
   * The event constructed by `or` will be sent to the registered first receiver, unless `register` function sends one.
   *
   * @param on  Generic event receiver registration function. It will be called on each receiver registration,
   * unless the receiver's {@link EventReceiver.Generic.supply event supply} is cut off already.
   * @param or  A function creating fallback event. When omitted, the initial event is expected to be sent by
   * `register` function. A receiver registration would lead to an error otherwise.
   */
  constructor(
      on: (this: void, receiver: EventReceiver.Generic<E>) => void,
      or: (this: void) => E = noEvent,
  ) {
    super(on);
    this._or = or;
  }

  /**
   * Event receiver registration function of this event keeper.
   *
   * Delegates to [[AfterEvent.to]] method.
   */
  get F(): AfterEvent.Fn<E> {
    return this.to.bind(this);
  }

  [AfterEvent__symbol](): this {
    return this;
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
   * @param receiver  Target receiver of events.
   *
   * @returns A supply of events from this keeper to the given `receiver`.
   */
  to(receiver: EventReceiver<E>): EventSupply;

  /**
   * Either starts sending events to the given `receiver`, or returns a reference to itself.
   *
   * @param receiver  Target receiver of events.
   *
   * @returns Either a supply of events from this keeper to the given `receiver`, or `this` instance when `receiver`
   * is omitted.
   */
  to(receiver?: EventReceiver<E>): this | EventSupply;

  to(receiver?: EventReceiver<E>): this | EventSupply {
    if (!receiver) {
      return this;
    }

    let dest: (context: EventReceiver.Context<E>, ...event: E) => void = noop;
    const generic = eventReceiver(receiver);

    if (generic.supply.isOff) {
      return generic.supply;
    }

    const supply = eventSupply().needs(generic.supply);
    let reported = false;

    this._on({
      supply,
      receive: (context, ...event: E) => {
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
   * Builds an [[AfterEvent]] keeper of events originated from this one that stops sending them to registered receiver
   * after the first one.
   *
   * @returns Event keeper.
   */
  once(): AfterEvent<E>;

  /**
   * Registers a receiver of events originated from this keeper that stops receiving them after the first one.
   *
   * @param receiver  A receiver of events to register.
   *
   * @returns A supply of event.
   */
  once(receiver: EventReceiver<E>): EventSupply;

  once(receiver?: EventReceiver<E>): AfterEvent<E> | EventSupply {
    return (this.once = afterEventBy(once(this)).F)(receiver);
  }

  /**
   * Builds an [[AfterEvent]] keeper that sends events from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param required  A peer of required event supply.
   * @param dependentSupply  The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New event keeper.
   */
  tillOff(required: EventSupplyPeer, dependentSupply?: EventSupply): AfterEvent<E> {
    return afterEventBy(tillOff(this, required, dependentSupply));
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

  /**
   * Constructs an [[AfterEvent]] keeper of original events passed trough the chain of transformations.
   *
   * This does the same as [[thru]] method, but return [[AfterEvent]] keeper instead of [[OnEvent]] sender. This can
   * not be done automatically, as not every transformation results to [[EventKeeper]]. E.g. when some events
   * are filtered out.
   *
   * The passes are preformed by `@proc7ts/call-thru` library. The event receivers registered by resulting event keeper
   * are called by the last pass in chain. Thus they can be e.g. filtered out or called multiple times.
   *
   * @returns An [[AfterEvent]] keeper of events transformed with provided passes. The returned keeper shares the supply
   * of transformed events among receivers.
   */
  keepThru<
      Return1,
      >(
      pass1: (this: void, ...args: E) => Return1,
  ): AfterEvent<Out<Return1>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
  ): AfterEvent<Out<Return2>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      Args11 extends Args<Return10>, Return11,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
      pass11: (this: void, ...args: Args11) => Return11,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      Args11 extends Args<Return10>, Return11,
      Args12 extends Args<Return11>, Return12,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
      pass11: (this: void, ...args: Args11) => Return11,
      pass12: (this: void, ...args: Args12) => Return12,
  ): AfterEvent<Out<Return3>>;

  keepThru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      Args11 extends Args<Return10>, Return11,
      Args12 extends Args<Return11>, Return12,
      Args13 extends Args<Return12>, Return13,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
      pass11: (this: void, ...args: Args11) => Return11,
      pass12: (this: void, ...args: Args12) => Return12,
      pass13: (this: void, ...args: Args13) => Return13,
  ): AfterEvent<Out<Return3>>;

  keepThru(...passes: any[]): AfterEvent<any[]> {
    // eslint-disable-next-line
    return (this as any).keepThru_(...passes).share();
  }

  /**
   * Constructs an [[AfterEvent]] keeper of original events passed trough the chain of transformations without sharing
   * the transformed events supply.
   *
   * This method does the same as [[AfterEvent.keepThru]] one, except it does not share the supply of transformed
   * events among receivers. This may be useful e.g. when the result will be further transformed anyway.
   * It is wise to {@link AfterEvent.share share} the supply of events from final result in this case.
   *
   * @returns An [[AfterEvent]] keeper of events transformed with provided passes.
   */
  keepThru_<
      Return1,
      >(
      pass1: (this: void, ...args: E) => Return1,
  ): AfterEvent<Out<Return1>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
  ): AfterEvent<Out<Return2>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      Args11 extends Args<Return10>, Return11,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
      pass11: (this: void, ...args: Args11) => Return11,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      Args11 extends Args<Return10>, Return11,
      Args12 extends Args<Return11>, Return12,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
      pass11: (this: void, ...args: Args11) => Return11,
      pass12: (this: void, ...args: Args12) => Return12,
  ): AfterEvent<Out<Return3>>;

  keepThru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      Args5 extends Args<Return4>, Return5,
      Args6 extends Args<Return5>, Return6,
      Args7 extends Args<Return6>, Return7,
      Args8 extends Args<Return7>, Return8,
      Args9 extends Args<Return8>, Return9,
      Args10 extends Args<Return9>, Return10,
      Args11 extends Args<Return10>, Return11,
      Args12 extends Args<Return11>, Return12,
      Args13 extends Args<Return12>, Return13,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
      pass5: (this: void, ...args: Args5) => Return5,
      pass6: (this: void, ...args: Args6) => Return6,
      pass7: (this: void, ...args: Args7) => Return7,
      pass8: (this: void, ...args: Args8) => Return8,
      pass9: (this: void, ...args: Args9) => Return9,
      pass10: (this: void, ...args: Args10) => Return10,
      pass11: (this: void, ...args: Args11) => Return11,
      pass12: (this: void, ...args: Args12) => Return12,
      pass13: (this: void, ...args: Args13) => Return13,
  ): AfterEvent<Out<Return3>>;

  keepThru_(...passes: any[]): AfterEvent<any[]> {
    return afterEventBy(thru(this, passes as any));
  }

}

export namespace AfterEvent {

  /**
   * A signature of function registering receivers of events sent by event keeper.
   *
   * When called without parameters it returns an [[AfterEvent]] keeper. When called with event receiver as parameter
   * it returns a supply of events from that keeper.
   *
   * Available as [[AfterEvent.F]] property value.
   *
   * @typeparam E  An event type. This is a tuple of event receiver parameter types.
   */
  export interface Fn<E extends any[]> {

    /**
     * Returns the event keeper.
     *
     * @returns [[AfterEvent]] keeper the events originated from.
     */
    (
        this: void,
    ): AfterEvent<E>;

    /**
     * Registers a receiver of events sent by the keeper.
     *
     * @param receiver  A receiver of events to register.
     *
     * @returns A supply of events from the keeper to the given `receiver`.
     */
    (
        this: void,
        receiver: EventReceiver<E>,
    ): EventSupply;

    /**
     * Either registers a receiver of events sent by the keeper, or returns the keeper itself.
     *
     * @param receiver  A receiver of events to register.
     *
     * @returns Either a supply of events from the keeper to the given `receiver`, or [[AfterEvent]] keeper the events
     * originated from when `receiver` is omitted.
     */
    (
        this: void,
        receiver?: EventReceiver<E>,
    ): EventSupply | AfterEvent<E>;
  }

}

/**
 * Converts a plain event receiver registration function to [[AfterEvent]] keeper with a fallback.
 *
 * The event constructed by `fallback` will be sent to the registered first receiver, unless `register` function sends
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
    fallback?: (this: void) => E,
): AfterEvent<E> {
  return new AfterEvent(register, fallback);
}
