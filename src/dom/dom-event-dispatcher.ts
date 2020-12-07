/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/dom
 */
import { noop, Supply, SupplyPeer } from '@proc7ts/primitives';
import { EventReceiver } from '../base';
import { OnDomEvent, onDomEventBy } from './on-dom-event';

const domEventContext: EventReceiver.Context<any> = {
  onRecurrent: noop,
};

/**
 * DOM event dispatcher can be used to register event listeners of particular event types and dispatch events.
 *
 * @category DOM
 */
export class DomEventDispatcher implements SupplyPeer {

  readonly supply: Supply = new Supply();

  /**
   * @internal
   */
  private readonly _target: EventTarget;

  /**
   * Constructs DOM event dispatcher for the given event target.
   *
   * @param target - Event target to construct event dispatcher for.
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
   * The {@link Supply event supply} returned upon event listener registration unregisters it with
   * `EventTarget.removeEventListener()` once {@link Supply.off cut off}.
   *
   * @typeParam TEvent - Supported DOM event type.
   * @param type - DOM event type name.
   *
   * @returns {@link OnDomEvent} sender of DOM events of the given `type`.
   */
  on<TEvent extends Event>(type: string): OnDomEvent<TEvent> {
    return onDomEventBy<TEvent>((listener, opts) => {

      const { supply } = listener;

      supply.needs(this);

      if (!supply.isOff) {

        // Create unique DOM listener instance
        const domListener: EventListener = event => listener.receive(domEventContext, event as TEvent);

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
   * @param event - An event to dispatch.
   *
   * @returns `true` if either event's `cancelable` attribute value is `false` or its `preventDefault()` method was not
   * invoked, or `false` otherwise. Also returns `false` when {@link supply} is cut off.
   */
  dispatch(event: Event): boolean {
    return !this.supply.isOff && this._target.dispatchEvent(event);
  }

}
