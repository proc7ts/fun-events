/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop, Supply } from '@proc7ts/primitives';
import { AfterEvent, afterEventBy } from '../after-event';
import { AfterEvent__symbol, EventKeeper, EventReceiver, sendEventsTo } from '../base';
import { onceEvent, shareEvents } from '../impl';

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

  const registerReceiver = (receiver: EventReceiver.Generic<TEvent[]>): void => {

    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);
    let send: () => void = noop;
    const result: TEvent[] = [];

    sources.forEach((source, index) => {
      supply.needs(source[AfterEvent__symbol]()((...event) => {
        result[index] = event;
        send();
      }).needs(supply));
    });

    if (!supply.isOff) {
      send = () => dispatch(...result);
    }
  };

  const latestEvent = (): TEvent[] => {

    const result: TEvent[] = [];

    sources.forEach(
        source => onceEvent(source[AfterEvent__symbol]())({
          supply: new Supply(),
          receive: (_ctx, ...event) => result.push(event),
        }),
    );

    return result;
  };

  return afterEventBy(shareEvents(afterEventBy(registerReceiver, latestEvent)));
}
