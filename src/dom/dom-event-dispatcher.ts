/**
 * @module fun-events
 */
import { noop } from 'call-thru';
import { EventReceiver } from '../event-receiver';
import { eventSupply } from '../event-supply';
import { OnDomEvent, onDomEventBy } from './on-dom-event';

const domEventContext: EventReceiver.Context<any> = {
  afterRecurrent: noop,
};

/**
 * DOM event dispatcher can be used to register event listeners and dispatch events.
 *
 * @category DOM
 */
export class DomEventDispatcher {

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

      // Create unique DOM listener instance
      const domListener: EventListener = listener.bind(domEventContext) as EventListener;

      this._target.addEventListener(type, domListener, opts);

      return eventSupply(() => this._target.removeEventListener(type, domListener));
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
   * invoked, or `false` otherwise.
   */
  dispatch(event: Event): boolean {
    return this._target.dispatchEvent(event);
  }

}
