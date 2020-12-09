/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/dom
 */
import { Supply } from '@proc7ts/primitives';
import { eventReceiver, EventReceiver } from '../base';
import { OnEvent } from '../on-event';

/**
 * DOM event listener.
 *
 * DOM events are never recurrent.
 *
 * @category DOM
 * @typeParam TEvent - Supported DOM event type.
 */
export type DomEventListener<TEvent extends Event> = EventReceiver<[TEvent]>;

/**
 * An {@link EventSender} implementation able to register DOM event listeners.
 *
 * @category DOM
 * @typeParam TEvent - Supported DOM event type.
 */
export class OnDomEvent<TEvent extends Event> extends OnEvent<[TEvent]> {

  /**
   * DOM event listener registration function of this event sender.
   *
   * Delegates to {@link OnDomEvent.to} method.
   */
  get F(): OnDomEvent.Fn<TEvent> {
    return this.to.bind(this);
  }

  /**
   * Returns a reference to itself.
   *
   * @returns `this` instance.
   */
  to(): this;

  /**
   * Starts sending DOM events to the given `listener`.
   *
   * @param listener - Target listener of DOM events.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events from this sender to the given `listener`.
   */
  to(listener: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): Supply;

  /**
   * Either starts sending DOM events to the given `listener`, or returns a reference to itself.
   *
   * @param listener - Target listener of DOM events.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns Either a supply of DOM events from this sender to the given `listener`, or `this` instance when `listener`
   * is omitted.
   */
  to(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): this | Supply;

  to(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): this | Supply {
    if (!listener) {
      return this;
    }

    const receiver = eventReceiver(listener);
    const { supply } = receiver;

    if (!supply.isOff) {
      (this._on as (
          this: void,
          listener: EventReceiver.Generic<[TEvent]>,
          opts?: AddEventListenerOptions | boolean,
      ) => void)(receiver, opts);
    }

    return supply;
  }

}

export namespace OnDomEvent {

  /**
   * A signature of function registering listeners of DOM events sent by event sender.
   *
   * When called without parameters it returns an {@link OnDomEvent} sender. When called with DOM event listener
   * as parameter it returns a supply of DOM events from that sender.
   *
   * Available as {@link OnDomEvent.F} property value.
   *
   * @typeParam TEvent - Supported DOM event type.
   */
  export type Fn<TEvent extends Event> = Method<void, TEvent>;

  /**
   * A signature of function registering listeners of DOM events sent by event sender.
   *
   * When called without parameters it returns an {@link OnDomEvent} sender. When called with DOM event listener
   * as parameter it returns a supply of DOM events from that sender.
   *
   * @typeParam TThis - `this` context type.
   * @typeParam TEvent - Supported DOM event type.
   */
  export interface Method<TThis, TEvent extends Event> {

    /**
     * Returns the DOM events sender.
     *
     * @returns {@link OnDomEvent} sender the events originated from.
     */
    (
        this: TThis,
    ): OnDomEvent<TEvent>;

    /**
     * Registers a listener of DOM events sent by the sender.
     *
     * @param listener - A listener of DOM events to register.
     * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
     *
     * @returns A supply of DOM events from the sender to the given `listener`.
     */
    (
        this: TThis,
        listener: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ): Supply;

    /**
     * Either registers a listener of DOM events sent by the sender, or returns the sender itself.
     *
     * @param listener - A listener of DOM events to register.
     * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
     *
     * @returns Either a supply of DOM events from the sender to the given `listener`, or {@link OnDomEvent} sender
     * the events originated from when `listener` is omitted.
     */
    (
        this: TThis,
        listener?: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ): Supply | OnDomEvent<TEvent>;

  }

}

/**
 * Converts a plain DOM event listener registration function to {@link OnDomEvent} sender.
 *
 * @category DOM
 * @typeParam TEvent - Supported DOM event type.
 * @param register - A generic DOM event listener registration function.
 *
 * @returns An {@link OnDomEvent} sender registering event listeners with the given `register` function.
 */
export function onDomEventBy<TEvent extends Event>(
    register: (
        this: void,
        listener: EventReceiver.Generic<[TEvent]>,
        opts?: AddEventListenerOptions | boolean,
    ) => void,
): OnDomEvent<TEvent> {
  return new OnDomEvent(register);
}
