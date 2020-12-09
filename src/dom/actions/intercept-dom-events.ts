/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/dom
 */
import { eventReceiver } from '../../base';
import { DomEventListener, OnDomEvent, onDomEventBy } from '../on-dom-event';

/**
 * Creates an {@link OnDomEvent} sender preventing other listeners of the same event from being called.
 *
 * Causes listeners to invoke an [Event.stopImmediatePropagation()] method prior to event handing.
 *
 * [Event.stopImmediatePropagation()]: https://developer.mozilla.org/en-US/docs/Web/API/Event/stopImmediatePropagation
 *
 * @category DOM
 * @typeParam TEvent - DOM event type.
 * @param supplier - DOM events sender.
 *
 * @returns DOM events sender.
 */
export function interceptDomEvents<TEvent extends Event>(
    supplier: OnDomEvent<TEvent>,
): OnDomEvent<TEvent> {
  return onDomEventBy((
      listener: DomEventListener<TEvent>,
      opts?: AddEventListenerOptions | boolean,
  ) => {

    const receiver = eventReceiver(listener);

    return supplier(
        {
          supply: receiver.supply,
          receive(context, event) {
            event.stopImmediatePropagation();
            receiver.receive(context, event);
          },
        },
        opts,
    );
  });
}
