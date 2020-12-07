/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop } from '@proc7ts/primitives';
import { receiveByEach } from './event-notifier.impl';
import { eventReceiver, EventReceiver } from './event-receiver';

/**
 * Creates an event sender targeted specific receiver.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 *
 * @param receiver - Target event receiver.
 *
 * @returns A function accepting events and sending them to target `receiver`.
 */
export function sendEventsTo<TEvent extends any[]>(
    receiver: EventReceiver<TEvent>,
): (this: void, ...event: TEvent) => void {

  const generic = eventReceiver(receiver);
  let send: (...event: TEvent) => void = receiveByEach([generic]);

  generic.supply.whenOff(() => send = noop);

  return (...event) => send(...event);
}
