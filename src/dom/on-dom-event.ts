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

  /**
   * Builds an {@link OnDomEvent} sender of events originated from this sender that enables event capturing by default.
   *
   * This corresponds to specifying `true` or `{ capture: true }` as a second argument to
   * `EventTarget.addEventListener()`.
   *
   * @returns DOM events sender.
   */
  capture(): OnDomEvent<TEvent>;

  /**
   * Registers a capturing listener of DOM events.
   *
   * This corresponds to specifying `true` or `{ capture: true }` as a second argument to
   * `EventTarget.addEventListener()`.
   *
   * @param listener - A DOM events listener to register.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  capture(listener: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): Supply;

  capture(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): OnDomEvent<TEvent> | Supply {
    return (this.capture = onDomEventBy((
        listener: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ) => {
      if (opts == null) {
        return this.to(listener, true);
      }
      if (typeof opts === 'object' && opts.capture == null) {
        return this.to(listener, { ...opts, capture: true });
      }
      return this.to(listener, opts);
    }).F)(listener, opts);
  }

  /**
   * Builds an {@link OnDomEvent} sender of events originated from this sender that registers listeners to invoke
   * instead of the default action.
   *
   * It invokes an `Event.preventDefault()` method prior to calling the registered listener.
   *
   * @returns DOM events sender.
   */
  instead(): OnDomEvent<TEvent>;

  /**
   * Registers a listener of DOM events to invoke instead of default action.
   *
   * This listener invokes an `Event.preventDefault()` method prior to event handling.
   *
   * @param listener - A DOM events listener to register.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  instead(listener: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): Supply;

  instead(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): OnDomEvent<TEvent> | Supply {
    return (this.instead = onDomEventBy((
        listener: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ) => {

      const receiver = eventReceiver(listener);

      return this.to(
          {
            supply: receiver.supply,
            receive(context, event) {
              event.preventDefault();
              receiver.receive(context, event);
            },
          },
          opts,
      );
    }).F)(listener, opts);
  }

  /**
   * Builds an {@link OnDomEvent} sender of events originate from this sender that registers listeners preventing
   * further propagation of current event in the capturing and bubbling phases.
   *
   * It invokes an `Event.stopPropagation()` method prior to calling the registered listener.
   *
   * @returns DOM events sender.
   */
  just(): OnDomEvent<TEvent>;

  /**
   * Registers a listener of DOM events preventing further propagation of current event in the capturing and bubbling
   * phases.
   *
   * This listener invokes an `Event.stopPropagation()` method prior to event handling.
   *
   * @param listener - A DOM events listener to register.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  just(listener: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): Supply;

  just(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): OnDomEvent<TEvent> | Supply {
    return (this.just = onDomEventBy((
        listener: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ) => {

      const receiver = eventReceiver(listener);

      return this.to(
          {
            supply: receiver.supply,
            receive(context, event) {
              event.stopPropagation();
              receiver.receive(context, event);
            },
          },
          opts,
      );
    }).F)(listener, opts);
  }

  /**
   * Builds an {@link OnDomEvent} sender of events originated from this sender that registers the last event listener.
   *
   * It invokes an `Event.stopImmediatePropagation()` method prior to calling the registered listener.
   *
   * @returns DOM event sender.
   */
  last(): OnDomEvent<TEvent>;

  /**
   * Registers the last DOM event listener.
   *
   * This listener invokes an `Event.stopImmediatePropagation()` method prior to event handling.
   *
   * @param listener - A DOM events listener to register.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  last(listener: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): Supply;

  last(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): OnDomEvent<TEvent> | Supply {
    return (this.last = onDomEventBy((
        listener: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ) => {

      const receiver = eventReceiver(listener);

      return this.to(
          {
            supply: receiver.supply,
            receive(context, event) {
              event.stopImmediatePropagation();
              receiver.receive(context, event);
            },
          },
          opts,
      );
    }).F)(listener, opts);
  }

  /**
   * Builds an {@link OnDomEvent} sender of events originated from this sender that accepts listeners never calling
   * `Event.preventDefault()`.
   *
   * This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.
   *
   * @returns DOM event listener.
   */
  passive(): OnDomEvent<TEvent>;

  /**
   * Registers a DOM event listener that never calls `Event.preventDefault()`.
   *
   * This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.
   *
   * @param listener - A DOM events listener to register.
   * @param opts - DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  passive(listener: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): Supply;

  passive(listener?: DomEventListener<TEvent>, opts?: AddEventListenerOptions | boolean): OnDomEvent<TEvent> | Supply {
    return (this.passive = onDomEventBy((
        listener: DomEventListener<TEvent>,
        opts?: AddEventListenerOptions | boolean,
    ) => {
      if (opts == null) {
        return this.to(listener, { passive: true });
      }
      if (typeof opts === 'boolean') {
        return this.to(listener, { capture: opts, passive: true });
      }
      if (opts.passive == null) {
        return this.to(listener, { ...opts, passive: true });
      }
      return this.to(listener, opts);
    }).F)(listener, opts);
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
