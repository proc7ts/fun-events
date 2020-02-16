/**
 * @packageDocumentation
 * @module fun-events
 */
import { noop } from 'call-thru';
import { AfterEvent, afterEventBy, afterSupplied } from '../after-event';
import { AfterEvent__symbol, EventKeeper, EventNotifier, EventReceiver } from '../base';

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

    const notifier = new EventNotifier<[{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }]>();
    const supply = notifier.on(receiver);
    let send: () => void = noop;
    const result: { [K in keyof S]: EventKeeper.Event<S[K]> } = {} as any;

    keys.forEach((key: keyof S) => {
      supply.needs(sources[key][AfterEvent__symbol]((...event) => {
        result[key] = event;
        send();
      }).needs(supply));
    });

    if (!supply.isOff) {
      send = () => notifier.send(result);
    }
  }

  function latestEvent(): [{ readonly [K in keyof S]: EventKeeper.Event<S[K]> }] {

    const result: { [K in keyof S]: EventKeeper.Event<S[K]> } = {} as any;

    keys.forEach(
        key => afterSupplied(sources[key]).once(
            (...event) => result[key as keyof S] = event,
        ),
    );

    return [result];
  }
}
