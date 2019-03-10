import { OnDomEvent } from './on-dom-event';
import { eventInterest } from '../event-interest';

/**
 * DOM event dispatcher can be used to register event listeners and dispatch events.
 */
export class DomEventDispatcher {

  /**
   * @internal
   */
  private readonly _target: EventTarget;

  /**
   * Constructs DOM event dispatcher for the given event target.
   *
   * @param target Event target to construct event dispatcher for.
   */
  constructor(target: EventTarget) {
    this._target = target;
  }

  /**
   * Returns a DOM event listener registrar for the given event type.
   *
   * The returned DOM event listener registrar calls an `EventTarget.addEventListener()` to register listeners.
   * But, in contrast, it allows to register the same listener many times.
   *
   * The `EventInterest` returned upon event listener registration, unregisters the given event listener with
   * `EventTarget.removeEventListener()` when its `off()` method is called.
   */
  on<E extends Event>(type: string): OnDomEvent<E> {
    return OnDomEvent.by<E>((listener, opts) => {

      const _listener: EventListener = event => listener(event as E); // Create unique listener instance

      this._target.addEventListener(type, _listener, opts);

      return eventInterest(() => this._target.removeEventListener(type, _listener));
    });
  }

  /**
   * Dispatches the given DOM event to event target.
   *
   * Calls `EventTarget.dispatchEvent()` method.
   *
   * @param event An event to dispatch.
   *
   * @returns `true` if either event's `cancelable` attribute value is `false` or its `preventDefault()` method was not
   * invoked, or `false` otherwise.
   */
  dispatch(event: Event): boolean {
    return this._target.dispatchEvent(event);
  }

}
