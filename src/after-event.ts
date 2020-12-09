/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop, Supply } from '@proc7ts/primitives';
import { AfterEvent__symbol, EventKeeper, eventReceiver, EventReceiver } from './base';
import { OnEvent } from './on-event';

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
