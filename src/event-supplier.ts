/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventKeeper } from './event-keeper';
import { EventSender } from './event-sender';

/**
 * A supplier of events.
 *
 * Either an {@link EventSender event sender}, or {@link EventKeeper event keeper}.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export type EventSupplier<E extends any[]> = EventSender<E> | EventKeeper<E>;
