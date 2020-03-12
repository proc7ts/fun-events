/**
 * @packageDocumentation
 * @module fun-events/dom
 */
import { noop } from 'call-thru';
import { EventReceiver, eventSupply, EventSupply, EventSupply__symbol, eventSupplyOf, EventSupplyPeer } from '../base';
import { OnDomEvent, onDomEventBy } from './on-dom-event';

const domEventContext: EventReceiver.Context<any> = {
  onRecurrent: noop,
};

/**
 * DOM event dispatcher can be used to register event listeners of particular event types and dispatch events.
 *
 * @category DOM
 */
export class DomEventDispatcher implements EventSupplyPeer {

  readonly [EventSupply__symbol]: EventSupply = eventSupply();

  /**
   * @internal
   */
  private readonly _target: EventTarget;

  /**
   * Constructs DOM event dispatcher for the given event target.
   *
   * @param target  Event target to construct event dispatcher for.
   */
  constructor(target: EventTarget) {
    this._target = target;
  }

  /**
   * Returns a sender of DOM events of the given `type`.
   *
   * The returned DOM event sender calls an `EventTarget.addEventListener()` to register listeners.
   * But, in contrast, it allows to register the same listener many times.
   *
   * The {@link EventSupply event supply} returned upon event listener registration unregisters it with
   * `EventTarget.removeEventListener()` once {@link EventSupply.off cut off}.
   *
   * @typeparam E  Supported DOM event type.
   * @param type  DOM event type name.
   *
   * @returns [[OnDomEvent]] sender of DOM events of the given `type`.
   */
  on<E extends Event>(type: string): OnDomEvent<E> {
    return onDomEventBy<E>((listener, opts) => {

      const { supply } = listener;

      supply.needs(eventSupplyOf(this));

      if (!supply.isOff) {

        // Create unique DOM listener instance
        const domListener: EventListener = event => listener.receive(domEventContext, event as E);

        this._target.addEventListener(type, domListener, opts);
        listener.supply.whenOff(() => this._target.removeEventListener(type, domListener));
      }
    });
  }

  /**
   * Dispatches the given DOM event to event target.
   *
   * Calls `EventTarget.dispatchEvent()` method.
   *
   * @param event  An event to dispatch.
   *
   * @returns `true` if either event's `cancelable` attribute value is `false` or its `preventDefault()` method was not
   * invoked, or `false` otherwise. Also returns `false` after [[done]] method called.
   */
  dispatch(event: Event): boolean {
    return !eventSupplyOf(this).isOff && this._target.dispatchEvent(event);
  }

  /**
   * Removes all registered event listeners and rejects new listeners registration and event dispatching.
   *
   * @param reason  A reason to unregister event listeners.
   *
   * @returns `this` instance.
   */
  done(reason?: any): this {
    eventSupplyOf(this).off(reason);
    return this;
  }

}
