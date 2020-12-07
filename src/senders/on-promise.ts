/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { EventReceiver } from '../base';
import { alwaysReceiveValue, neverReceiveBecause } from '../base/impl';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Represents a promise as event sender.
 *
 * When the `promise` resolves successfully the resolved value is sent to registered event receivers. The events
 * supply is {@link Supply.off cut off} immediately after that without any reason specified.
 *
 * When the `promise` is rejected the events supply is {@link Supply.off cut off} with promise rejection reason.
 *
 * @category Core
 * @typeParam T - A type of value the promise is resolved to.
 * @param promise - The promise to represent as event sender.
 *
 * @returns An {@link OnEvent} sender of the given `promise` settlement event.
 */
export function onPromise<T>(promise: Promise<T>): OnEvent<[T]> {

  let receive = (receiver: EventReceiver.Generic<[T]>): void => {
    promise.then(() => receive(receiver), () => receive(receiver));
  };

  promise.then(value => {
    receive = alwaysReceiveValue(value);
  }).catch(e => {
    receive = neverReceiveBecause(e);
  });

  return onEventBy(receiver => receive(receiver));
}
