/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/call-thru
 */
import { shareEvents } from '../actions';
import { OnEvent, onEventBy } from '../on-event';
import { OnEventThru } from './on-event-thru';
import { thru } from './thru.impl';

/**
 * Creates a transformer of events originated from {@link OnEvent} sender.
 *
 * @typeParam TEvent - An type of events to transform.
 *
 * @returns A transformer of event sender.
 */
export function thruOn<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): OnEventThru<TEvent> {

  const forEach = (...passes: any[]): OnEvent<any> => onEventBy(thru(supplier, passes));

  return {
    forAll: (...passes: any[]) => shareEvents(forEach(...passes)),
    forEach,
  };
}
