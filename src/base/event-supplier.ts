import { EventKeeper } from './event-keeper';
import { EventSender } from './event-sender';

/**
 * A supplier of events.
 *
 * Either an {@link EventSender event sender}, or {@link EventKeeper event keeper}.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export type EventSupplier<TEvent extends any[]> = EventSender<TEvent> | EventKeeper<TEvent>;
