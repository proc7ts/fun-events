import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { EventSender, OnEvent__symbol } from './event-sender';

/**
 * Consumes nested events.
 *
 * @param sender Original event sender.
 * @param consume A function expected to register an event receiver in nested event sender and return corresponding
 * event interest. This interest will be lost on new event. An `undefined` may be returned instead to indicate that no
 * nested events expected.
 *
 * @returns An event interest that will stop consuming events once lost.
 */
export function consumeNestedEvents<E extends any[]>(
    sender: EventSender<E>,
    consume: (...event: E) => EventInterest | undefined): EventInterest {

  let consumerInterest = noEventInterest();
  const senderInterest = sender[OnEvent__symbol]((...event: E) => {
    consumerInterest.off();
    consumerInterest = consume(...event) || noEventInterest();
  });

  return eventInterest(reason => {
    consumerInterest.off(reason);
    senderInterest.off(reason);
  }).needs(senderInterest);
}
