/**
 * @packageDocumentation
 * @module fun-events
 */
import {
  AfterEvent__symbol,
  eventReceiver,
  EventReceiver,
  EventSender,
  EventSupplier,
  eventSupply,
  EventSupply,
  eventSupplyOf,
  EventSupplyPeer,
  isEventSender,
  noEventSupply,
  OnEvent__symbol,
} from './base';
import { once, share, then, thru, tillOff } from './impl';
import { OnEventCallChain } from './passes';
import Args = OnEventCallChain.Args;
import Out = OnEventCallChain.Out;

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
export abstract class OnEvent<E extends any[]> extends Function implements EventSender<E>, PromiseLike<E> {

  get [OnEvent__symbol](): this {
    return this;
  }

  /**
   * Attaches callbacks to the next event and/or supply cut off reason.
   *
   * This method makes event sender act as promise-like for the next event. This it is possible e.g. to use it in
   * `await` expression.
   *
   * @param onEvent  The callback to execute when next event received.
   * @param onCutOff  The callback to execute when supply is cut off before the next event received.
   *
   * @returns A Promise for the next event.
   */
  then<TResult1 = E, TResult2 = never>(
      onEvent?: ((value: E) => TResult1 | PromiseLike<TResult1>) | undefined | null,
      onCutOff?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null,
  ): Promise<TResult1 | TResult2> {
    return then(this, onEvent, onCutOff);
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
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param required  A peer of required event supply.
   * @param dependentSupply  The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New event sender.
   */
  tillOff(required: EventSupplyPeer, dependentSupply?: EventSupply): OnEvent<E> {
    return onEventBy(tillOff(this, required, dependentSupply));
  }

  /**
   * Consumes events.
   *
   * @param consume  A function consuming events. This function may return a {@link EventSupplyPeer peer of event
   * supply} when registers a nested event receiver. This supply will be cut off on new event, unless returned again.
   *
   * @returns An event supply that will stop consuming events once {@link EventSupply.off cut off}.
   */
  consume(consume: (...event: E) => EventSupplyPeer | void | undefined): EventSupply {

    let consumerSupply = noEventSupply();
    const senderSupply = this((...event: E) => {

      const prevSupply = consumerSupply;

      try {
        consumerSupply = eventSupplyOf(consume(...event) || noEventSupply());
      } finally {
        if (consumerSupply !== prevSupply) {
          prevSupply.off();
        }
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
  thru<
      Return1,
      >(
      pass1: (this: void, ...args: E) => Return1,
  ): OnEvent<Out<Return1>>;

  thru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
  ): OnEvent<Out<Return2>>;

  thru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
  ): OnEvent<Out<Return3>>;

  thru<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

  thru<
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
  ): OnEvent<Out<Return3>>;

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
  thru_<
      Return1,
      >(
      pass1: (this: void, ...args: E) => Return1,
  ): OnEvent<Out<Return1>>;

  thru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
  ): OnEvent<Out<Return2>>;

  thru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
  ): OnEvent<Out<Return3>>;

  thru_<
      Return1,
      Args2 extends Args<Return1>, Return2,
      Args3 extends Args<Return2>, Return3,
      Args4 extends Args<Return3>, Return4,
      >(
      pass1: (this: void, ...args: E) => Return1,
      pass2: (this: void, ...args: Args2) => Return2,
      pass3: (this: void, ...args: Args3) => Return3,
      pass4: (this: void, ...args: Args4) => Return4,
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_<
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
  ): OnEvent<Out<Return3>>;

  thru_(...passes: any[]): OnEvent<any[]> {
    return thru(this, onEventBy, onSupplied, passes);
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
  (this: void, receiver: EventReceiver<E>): EventSupply;// eslint-disable-line @typescript-eslint/prefer-function-type

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
export const onNever: OnEvent<any> = (/*#__PURE__*/ onEventBy(({ supply }) => supply.off()));
