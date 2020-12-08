import { AfterEvent } from '../after-event';
import { once } from '../impl';
import { OnEvent } from '../on-event';

/**
 * Builds an {@link AfterEvent} keeper of events that stops sending them after the first one.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event keeper to receive an event from.
 *
 * @returns Event keeper.
 */
export function onceEvent<TEvent extends any[]>(
    supplier: AfterEvent<TEvent>,
): AfterEvent<TEvent>;

/**
 * Builds an {@link OnEvent} sender of events that stops sending them after the first one.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 * @param supplier - Event sender to receive an event from.
 *
 * @returns Event sender.
 */
export function onceEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEvent<TEvent>;

export function onceEvent<TEvent extends any[]>(
    supplier: OnEvent<TEvent> | AfterEvent<TEvent>,
): OnEvent<TEvent> | AfterEvent<TEvent> {
  return (supplier as OnEvent<TEvent>).by(once(supplier));
}
