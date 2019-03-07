import { eventInterest, EventInterest, noEventInterest } from './event-interest';
import { EventSender, OnEvent__symbol } from './event-sender';

/**
 * Creates a nested events consumer registration function.
 *
 * The event consumer registered by the returned function is expected to register an event receiver in nested event
 * sender and return corresponding event interest. This interest will be lost on new event. An `undefined` may be
 * returned instead to indicate that no nested events expected.
 *
 * @param sender Original event sender.
 *
 * @returns A nested events consumer registrar.
 */
export function consumeNestedEvents<E extends any[]>(
    sender: EventSender<E>):
    (consumer: (...event: E) => EventInterest | undefined) => EventInterest {
  return consumer => {

    let consumerInterest = noEventInterest();

    const result = sender[OnEvent__symbol]((...event: E) => {
      consumerInterest.off();
      consumerInterest = consumer(...event) || noEventInterest();
    });

    return eventInterest(() => {
      consumerInterest.off();
      result.off();
    });
  };
}
