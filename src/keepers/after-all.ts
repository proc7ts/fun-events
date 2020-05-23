/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { noop } from '@proc7ts/call-thru';
import { AfterEvent, afterEventBy } from '../after-event';
import { AfterEvent__symbol, EventKeeper, EventReceiver, sendEventsTo } from '../base';
import { afterSupplied } from './after-supplied';

/**
 * Builds an [[AfterEvent]] keeper of events sent by all event keepers in `sources` map.
 *
 * @category Core
 * @typeparam S  A type of `sources` map.
 * @param sources  A map of named event keepers the events are originated from.
 *
 * @returns An event keeper sending a map of events received from each source keeper. Each event in this map has the
 * same key as its source keeper in `sources`.
 */
export function afterAll<S extends { readonly [key: string]: EventKeeper<any> }>(
    sources: S,
): AfterEvent<[{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }]> {

  const keys = Object.keys(sources);

  return afterEventBy(registerReceiver, latestEvent).share();

  function registerReceiver(
      receiver: EventReceiver.Generic<[{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }]>,
  ): void {

    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);
    let send: () => void = noop;
    const result = {} as { [K in keyof S]: EventKeeper.Event<S[K]> };

    keys.forEach(<K extends keyof S>(key: K) => {
      supply.needs(sources[key][AfterEvent__symbol]().to((...event: EventKeeper.Event<S[K]>) => {
        result[key] = event;
        send();
      }).needs(supply));
    });

    if (!supply.isOff) {
      send = () => dispatch(result);
    }
  }

  function latestEvent(): [{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }] {

    const result = {} as { [K in keyof S]: EventKeeper.Event<S[K]> };

    keys.forEach(
        <K extends keyof S>(key: K) => afterSupplied(sources[key]).once(
            (...event: EventKeeper.Event<S[K]>) => result[key as keyof S] = event,
        ),
    );

    return [result];
  }
}
