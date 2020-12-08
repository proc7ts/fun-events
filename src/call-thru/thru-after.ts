/**
 * @packageDocumentation
 * @module @proc7ts/fun-events/call-thru
 */
import { shareEvents } from '../actions';
import { AfterEvent, afterEventBy } from '../after-event';
import { AfterEventThru } from './after-event-thru';
import { thru } from './thru.impl';

/**
 * Creates a transformer of events originated from {@link AfterEvent} keeper and resulting to another event keeper.
 *
 * @typeParam TEvent - An type of events to transform.
 *
 * @returns A transformer of event keeper.
 */
export function thruAfter<TEvent extends any[]>(
    supplier: AfterEvent<TEvent>,
): AfterEventThru<TEvent> {

  const forEach = (...passes: any[]): AfterEvent<any> => afterEventBy(thru(supplier, passes));

  return {
    forAll: (...passes: any[]): AfterEvent<any> => shareEvents(forEach(...passes)),
    forEach,
  };
}
