/**
 * @packageDocumentation
 * @module fun-events/dom
 */
import { eventReceiver, EventReceiver, EventSupply, EventSupplyPeer } from '../base';
import { once, tillOff } from '../impl';
import { OnEvent } from '../on-event';

/**
 * DOM event listener.
 *
 * DOM events are never recurrent.
 *
 * @category DOM
 * @typeparam E  Supported DOM event type.
 */
export type DomEventListener<E extends Event> = EventReceiver<[E]>;

/**
 * An [[EventSender]] implementation able to register DOM event listeners.
 *
 * @category DOM
 * @typeparam E  Supported DOM event type.
 */
export class OnDomEvent<E extends Event> extends OnEvent<[E]> {

  /**
   * DOM event listener registration function of this event sender.
   *
   * Delegates to [[OnDomEvent.to]] method.
   */
  get F(): OnDomEvent.Fn<E> {
    return this.to.bind(this) as OnDomEvent.Fn<E>;
  }

  /**
   * Returns a reference to itself.
   *
   * @returns `this` instance.
   */
  to(): this;

  /**
   * Starts sending DOM events to the given listener.
   *
   * @param listener  Target receiver of DOM events.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events from this sender to the given `listener`.
   */
  to(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  to(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): this | EventSupply {
    if (!listener) {
      return this;
    }

    const receiver = eventReceiver(listener);
    const { supply } = receiver;

    if (!supply.isOff) {
      (this._on as (
          this: void,
          listener: EventReceiver.Generic<[E]>,
          opts?: AddEventListenerOptions | boolean,
      ) => void)(receiver, opts);
    }

    return supply;
  }

  /**
   * Builds an [[OnDomEvent]] sender of events originated from this one that stops sending them to registered receiver
   * after the first one.
   *
   * @returns DOM event sender.
   */
  once(): OnDomEvent<E>;

  /**
   * Registers a listener of DOM events originated from this sender that stops receiving them after the first one.
   *
   * @param listener  A DOM event listener to register.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM event.
   */
  once(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  once(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): OnDomEvent<E> | EventSupply {
    return (this.once = onDomEventBy(once(this)).F)(listener, opts);
  }

  /**
   * Builds an [[OnDomEvent]] sender that sends events from this one until the required `supply` is cut off.
   *
   * The outgoing events supply will be cut off once incoming event supply does. Unless a second supply passed in.
   * In the latter case that supply will be cut off instead.
   *
   * @param required  A peer of required event supply.
   * @param dependentSupply  The supply to cut off on cutting off the incoming events supply.
   *
   * @returns New DOM event sender.
   */
  tillOff(required: EventSupplyPeer, dependentSupply?: EventSupply): OnDomEvent<E> {
    return onDomEventBy(tillOff(this, required, dependentSupply));
  }

  /**
   * Builds an [[OnDomEvent]] sender of events originated from this sender that enables event capturing by default.
   *
   * This corresponds to specifying `true` or `{ capture: true }` as a second argument to
   * `EventTarget.addEventListener()`.
   *
   * @returns DOM events sender.
   */
  capture(): OnDomEvent<E>;

  /**
   * Registers a capturing listener of DOM events.
   *
   * This corresponds to specifying `true` or `{ capture: true }` as a second argument to
   * `EventTarget.addEventListener()`.
   *
   * @param listener  A DOM events listener to register.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  capture(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  capture(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): OnDomEvent<E> | EventSupply {
    return (this.capture = onDomEventBy((
        listener: DomEventListener<E>,
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
   * Builds an [[OnDomEvent]] sender of events originated from this sender that registers listeners to invoke instead
   * of the default action.
   *
   * It invokes an `Event.preventDefault()` method prior to calling the registered listener.
   *
   * @returns DOM events sender.
   */
  instead(): OnDomEvent<E>;

  /**
   * Registers a listener of DOM events to invoke instead of default action.
   *
   * This listener invokes an `Event.preventDefault()` method prior to event handling.
   *
   * @param listener  A DOM events listener to register.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  instead(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  instead(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): OnDomEvent<E> | EventSupply {
    return (this.instead = onDomEventBy((
        listener: DomEventListener<E>,
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
   * Builds an [[OnDomEvent]] sender of events originate from this sender that registers listeners preventing further
   * propagation of current event in the capturing and bubbling phases.
   *
   * It invokes an `Event.stopPropagation()` method prior to calling the registered listener.
   *
   * @returns DOM events sender.
   */
  just(): OnDomEvent<E>;

  /**
   * Registers a listener of DOM events preventing further propagation of current event in the capturing and bubbling
   * phases.
   *
   * This listener invokes an `Event.stopPropagation()` method prior to event handling.
   *
   * @param listener  A DOM events listener to register.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  just(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  just(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): OnDomEvent<E> | EventSupply {
    return (this.just = onDomEventBy((
        listener: DomEventListener<E>,
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
   * Builds an [[OnDomEvent]] sender of events originated from this sender that registers the last event listener.
   *
   * It invokes an `Event.stopImmediatePropagation()` method prior to calling the registered listener.
   *
   * @returns DOM event sender.
   */
  last(): OnDomEvent<E>;

  /**
   * Registers the last DOM event listener.
   *
   * This listener invokes an `Event.stopImmediatePropagation()` method prior to event handling.
   *
   * @param listener  A DOM events listener to register.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  last(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  last(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): OnDomEvent<E> | EventSupply {
    return (this.last = onDomEventBy((
        listener: DomEventListener<E>,
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
   * Builds an [[OnDomEvent]] sender of events originated from this sender that accepts listeners never calling
   * `Event.preventDefault()`.
   *
   * This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.
   *
   * @returns DOM event listener.
   */
  passive(): OnDomEvent<E>;

  /**
   * Registers a DOM event listener that never calls `Event.preventDefault()`.
   *
   * This corresponds to specifying `{ passive: true }` as a second argument to `EventTarget.addEventListener()`.
   *
   * @param listener  A DOM events listener to register.
   * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
   *
   * @returns A supply of DOM events.
   */
  passive(listener: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): EventSupply;

  passive(listener?: DomEventListener<E>, opts?: AddEventListenerOptions | boolean): OnDomEvent<E> | EventSupply {
    return (this.passive = onDomEventBy((
        listener: DomEventListener<E>,
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
   * When called without parameters it returns an [[OnDomEvent]] sender. When called with DOM event listener
   * as parameter it returns a supply of DOM events from that sender.
   *
   * Available as [[OnDomEvent.F]] property value.
   *
   * @typeparam E  Supported DOM event type.
   */
  export interface Fn<E extends Event> {

    /**
     * Returns the DOM events sender.
     *
     * @returns [[OnDomEvent]] sender the events originated from.
     */
    (
        this: void,
    ): OnDomEvent<E>;

    /**
     * Registers a listener of DOM events sent by the sender.
     *
     * @param listener  A listener of DOM events to register.
     * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
     *
     * @returns A supply of DOM events from the sender to the given `listener`.
     */
    (
        this: void,
        listener: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean,
    ): EventSupply;

    /**
     * Either registers a listener of DOM events sent by the sender, or returns the sender itself.
     *
     * @param listener  A listener of DOM events to register.
     * @param opts  DOM event listener options to pass to `EventTarget.addEventListener()`.
     *
     * @returns Either a supply of DOM events from the sender to the given `listener`, or [[OnDomEvent]] sender
     * the events originated from when `listener` is omitted.
     */
    (
        this: void,
        listener?: DomEventListener<E>,
        opts?: AddEventListenerOptions | boolean,
    ): EventSupply | OnDomEvent<E>;

  }

}

/**
 * Converts a plain DOM event listener registration function to [[OnDomEvent]] sender.
 *
 * @category DOM
 * @typeparam E  Supported DOM event type.
 * @param register  A generic DOM event listener registration function.
 *
 * @returns An [[OnDomEvent]] sender registering event listeners with the given `register` function.
 */
export function onDomEventBy<E extends Event>(
    register: (
        this: void,
        listener: EventReceiver.Generic<[E]>,
        opts?: AddEventListenerOptions | boolean,
    ) => void,
): OnDomEvent<E> {
  return new OnDomEvent(register);
}
