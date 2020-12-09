/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply } from '@proc7ts/primitives';
import { eventReceiver, EventReceiver, EventSender, OnEvent__symbol } from './base';
import { then } from './impl';

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
   * @typeParam TResult - Action result type.
   * @param action - A function accepting this supplier as its only parameter, and returning action result.
   *
   * @returns Action result.
   */
  do<TResult>(
      action: (this: void, supplier: this) => TResult,
  ): TResult;

  /**
   * Applies the given actions to this event supplier.
   *
   * The value returned from each action is passed as argument to the next one. The value returned from the last action
   * is the result of this method call.
   *
   * @typeParam TResult1 - First action result type.
   * @typeParam TResult1 - Second action result type.
   * @param action1 - A function accepting this supplier as its only parameter, and returning a result.
   * @param action2 - A function accepting the first action result as its only parameter, and returning a result.
   *
   * @returns Actions application result.
   */
  do<
      TResult1,
      TResult2,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
  ): TResult2;

  do<
      TResult1,
      TResult2,
      TResult3,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
  ): TResult3;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
  ): TResult4;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
  ): TResult5;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
  ): TResult6;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
  ): TResult7;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
      action8: (this: void, arg: TResult7) => TResult8,
  ): TResult8;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
      action8: (this: void, arg: TResult7) => TResult8,
      action9: (this: void, arg: TResult8) => TResult9,
  ): TResult9;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
      action8: (this: void, arg: TResult7) => TResult8,
      action9: (this: void, arg: TResult8) => TResult9,
      action10: (this: void, arg: TResult9) => TResult10,
  ): TResult10;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      TResult11,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
      action8: (this: void, arg: TResult7) => TResult8,
      action9: (this: void, arg: TResult8) => TResult9,
      action10: (this: void, arg: TResult9) => TResult10,
      action11: (this: void, arg: TResult10) => TResult11,
  ): TResult11;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      TResult11,
      TResult12,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
      action8: (this: void, arg: TResult7) => TResult8,
      action9: (this: void, arg: TResult8) => TResult9,
      action10: (this: void, arg: TResult9) => TResult10,
      action11: (this: void, arg: TResult10) => TResult11,
      action12: (this: void, arg: TResult11) => TResult12,
  ): TResult12;

  do<
      TResult1,
      TResult2,
      TResult3,
      TResult4,
      TResult5,
      TResult6,
      TResult7,
      TResult8,
      TResult9,
      TResult10,
      TResult11,
      TResult12,
      TResult13,
      >(
      action1: (this: void, supplier: this) => TResult1,
      action2: (this: void, arg: TResult1) => TResult2,
      action3: (this: void, arg: TResult2) => TResult3,
      action4: (this: void, arg: TResult3) => TResult4,
      action5: (this: void, arg: TResult4) => TResult5,
      action6: (this: void, arg: TResult5) => TResult6,
      action7: (this: void, arg: TResult6) => TResult7,
      action8: (this: void, arg: TResult7) => TResult8,
      action9: (this: void, arg: TResult8) => TResult9,
      action10: (this: void, arg: TResult9) => TResult10,
      action11: (this: void, arg: TResult10) => TResult11,
      action12: (this: void, arg: TResult11) => TResult12,
      action13: (this: void, arg: TResult12) => TResult13,
  ): TResult13;

  do(
      ...actions: ((this: void, arg: any) => any)[]
  ): any {
    return actions.reduce((arg, action) => action(arg), this);
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
