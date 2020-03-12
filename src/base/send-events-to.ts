/**
 * @packageDocumentation
 * @module fun-events
 */
import { noop } from 'call-thru';
import { receiveByEach } from './event-notifier.impl';
import { eventReceiver, EventReceiver } from './event-receiver';

/**
 * Creates an event sender targeted specific receiver.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 *
 * @param receiver  Target event receiver.
 *
 * @returns A function accepting events and sending them to target `receiver`.
 */
export function sendEventsTo<E extends any[]>(receiver: EventReceiver<E>): (this: void, ...event: E) => void {

  const generic = eventReceiver(receiver);
  let send: (...event: E) => void = receiveByEach([generic]);

  generic.supply.whenOff(() => send = noop);

  return (...event) => send(...event);
}
