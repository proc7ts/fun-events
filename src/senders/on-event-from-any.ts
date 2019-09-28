/**
 * @module fun-events
 */
import { eventInterest, EventInterest } from '../event-interest';
import { EventKeeper } from '../event-keeper';
import { EventSender } from '../event-sender';
import { OnEvent, onEventBy, onEventFrom, onNever } from '../on-event';

/**
 * Builds an [[OnEvent]] registrar of receivers of events sent by any of the given senders of keepers.
 *
 * The resulting event sender exhausts as soon as all sources do.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 * @param sources  Event senders or keepers the events originated from.
 *
 * @returns An [[OnEvent]] registrar instance.
 */
export function onEventFromAny<E extends any[]>(...sources: (EventSender<E> | EventKeeper<E>)[]): OnEvent<E> {
  if (!sources.length) {
    return onNever;
  }

  return onEventBy<E>(receiver => {

    let remained = sources.length;
    let interests: EventInterest[] = [];
    const interest = eventInterest(interestLost);

    interests = sources.map(source => onEventFrom(source)(receiver).whenDone(sourceDone));

    return interest;

    function interestLost(reason: any) {
      interests.forEach(i => i.off(reason));
    }

    function sourceDone(reason: any) {
      if (!--remained) {
        interest.off(reason);
        interests = [];
      }
    }
  }).share();
}
