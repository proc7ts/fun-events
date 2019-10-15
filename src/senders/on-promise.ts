/**
 * @module fun-events
 */
import { eventInterest } from '../event-interest';
import { EventNotifier } from '../event-notifier';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Represents a promise as event sender.
 *
 * When the `promise` resolves successfully the resolved value is sent to registered event receivers. The events
 * are exhausted after that. I.e. the [[EventInterest.whenDone]] callbacks are called without any reason specified.
 *
 * When the `promise` is rejected the events are exhausted, and the [[EventInterest.whenDone]] callbacks are called
 * with rejection reason.
 *
 * @param promise  The promise to represent as event sender.
 *
 * @returns An [[OnEvent]] registrar of receivers of the given `promise` resolution.
 */
export function onPromise<T>(promise: Promise<T>): OnEvent<[T]> {
  return onEventBy(receiver => {

    const interest = eventInterest();

    promise.then(
        value => {

          const dispatcher = new EventNotifier<[T]>();

          dispatcher.on(receiver);
          dispatcher.send(value);
          interest.off();
        }
    ).catch(
        e => interest.off(e)
    );

    return interest;
  });
}
