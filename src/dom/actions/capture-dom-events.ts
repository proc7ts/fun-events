/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/dom
 */
import { DomEventListener, OnDomEvent, onDomEventBy } from '../on-dom-event';

/**
 * Creates an {@link OnDomEvent} sender that enables event capturing by default.
 *
 * This corresponds to specifying `true` or `{ capture: true }` as a second argument to
 * `EventTarget.addEventListener()`.
 *
 * @category DOM
 * @typeParam TEvent - DOM event type.
 * @param supplier - DOM events sender.
 *
 * @returns DOM events sender.
 */
export function captureDomEvents<TEvent extends Event>(
    supplier: OnDomEvent<TEvent>,
): OnDomEvent<TEvent> {
  return onDomEventBy((
      listener: DomEventListener<TEvent>,
      opts?: AddEventListenerOptions | boolean,
  ) => {
    if (opts == null) {
      return supplier(listener, true);
    }
    if (typeof opts === 'object' && opts.capture == null) {
      return supplier(listener, { ...opts, capture: true });
    }

    return supplier(listener, opts);
  });
}
