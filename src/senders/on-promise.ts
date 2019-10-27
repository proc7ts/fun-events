/**
 * @module fun-events
 */
import { EventNotifier } from '../event-notifier';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Represents a promise as event sender.
 *
 * When the `promise` resolves successfully the resolved value is sent to registered event receivers. The events
 * supply is {@link EventSupply.off cut off} immediately after that without any reason specified.
 *
 * When the `promise` is rejected the events supply is {@link EventSupply.off cut off} with promise rejection reason.
 *
 * @param promise  The promise to represent as event sender.
 *
 * @returns An [[OnEvent]] sender of the given `promise` settlement event.
 */
export function onPromise<T>(promise: Promise<T>): OnEvent<[T]> {
  return onEventBy(receiver => {

    const { supply } = receiver;

    promise.then(
        value => {

          const dispatcher = new EventNotifier<[T]>();

          dispatcher.on(receiver);
          dispatcher.send(value);
          supply.off();
        }
    ).catch(
        e => supply.off(e)
    );
  });
}
