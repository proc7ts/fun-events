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
 * Builds an {@link AfterEvent} keeper of events sent by all event keepers in `sources` map.
 *
 * @category Core
 * @typeParam TSrcMap - A type of `sources` map.
 * @param sources - A map of named event keepers the events are originated from.
 *
 * @returns An event keeper sending a map of events received from each source keeper. Each event in this map has the
 * same key as its source keeper in `sources`.
 */
export function afterAll<TSrcMap extends { readonly [key: string]: EventKeeper<any> }>(
    sources: TSrcMap,
): AfterEvent<[{ readonly [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> }]> {

  const keys = Object.keys(sources);

  return shareEvents(afterEventBy(registerReceiver, latestEvent));

  function registerReceiver(
      receiver: EventReceiver.Generic<[{ readonly [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> }]>,
  ): void {

    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);
    let send: () => void = noop;
    const result = {} as { [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> };

    keys.forEach(<K extends keyof TSrcMap>(key: K) => {
      supply.needs(sources[key][AfterEvent__symbol]().to((...event: EventKeeper.Event<TSrcMap[K]>) => {
        result[key] = event;
        send();
      }).needs(supply));
    });

    if (!supply.isOff) {
      send = () => dispatch(result);
    }
  }

  function latestEvent(): [{ readonly [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> }] {

    const result = {} as { [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> };

    keys.forEach(
        <K extends keyof TSrcMap>(key: K) => afterSupplied(sources[key]).once(
            (...event: EventKeeper.Event<TSrcMap[K]>) => result[key as keyof TSrcMap] = event,
        ),
    );

    return [result];
  }
}
