/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop } from '@proc7ts/primitives';
import { shareEvents } from '../actions';
import { AfterEvent, afterEventBy } from '../after-event';
import { AfterEvent__symbol, EventKeeper, EventReceiver, sendEventsTo } from '../base';
import { afterSupplied } from './after-supplied';

/**
 * Builds an {@link AfterEvent} keeper of events sent by each of the `sources`.
 *
 * @category Core
 * @typeParam TEvent - A type of events sent by each source.
 * @param sources - An array of source event keepers.
 *
 * @returns An event keeper sending events received from each source keeper. Each event item is an event tuple
 * originated from source keeper under its index in `sources` array.
 */
export function afterEach<TEvent extends any[]>(...sources: EventKeeper<TEvent>[]): AfterEvent<TEvent[]> {

  return shareEvents(afterEventBy(registerReceiver, latestEvent));

  function registerReceiver(receiver: EventReceiver.Generic<TEvent[]>): void {

    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);
    let send: () => void = noop;
    const result: TEvent[] = [];

    sources.forEach((source, index) => {
      supply.needs(source[AfterEvent__symbol]().to((...event) => {
        result[index] = event;
        send();
      }).needs(supply));
    });

    if (!supply.isOff) {
      send = () => dispatch(...result);
    }
  }

  function latestEvent(): TEvent[] {

    const result: TEvent[] = [];

    sources.forEach(
        source => afterSupplied(source).once(
            (...event) => result.push(event),
        ),
    );

    return result;
  }
}
