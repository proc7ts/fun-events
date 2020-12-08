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
   * @typeParam TOut - Action result type.
   * @typeParam TArgs - Action parameters type.
   * @param action - A function accepting this sender as its first parameter, and the given arguments as the rest of
   * them.
   * @param args - Arguments to pass to action function.
   *
   * @returns Action result.
   */
  do<TOut, TArgs extends any[]>(
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
