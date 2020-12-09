/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/dom
 */
import { eventReceiver } from '../../base';
import { DomEventListener, OnDomEvent, onDomEventBy } from '../on-dom-event';

/**
 * Creates an {@link OnDomEvent} sender preventing further propagation of events in the capturing and bubbling phases.
 *
 * Causes listeners to invoke an [Event.stopPropagation()] method prior to event handing.
 *
 * [Event.stopPropagation()]: https://developer.mozilla.org/en-US/docs/Web/API/Event/stopPropagation
 *
 * @category DOM
 * @typeParam TEvent - DOM event type.
 * @param supplier - DOM events sender.
 *
 * @returns DOM events sender.
 */
export function stopDomEvents<TEvent extends Event>(
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
            event.stopPropagation();
            receiver.receive(context, event);
          },
        },
        opts,
    );
  });
}
