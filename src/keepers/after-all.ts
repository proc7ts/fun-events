import { noop } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { AfterEvent, afterEventBy } from '../after-event';
import { AfterEvent__symbol, EventKeeper, EventReceiver, sendEventsTo } from '../base';
import { onceEvent, shareEvents } from '../impl';

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

  const registerReceiver = (
    receiver: EventReceiver.Generic<
      [{ readonly [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> }]
    >,
  ): void => {
    const { supply } = receiver;
    const dispatch = sendEventsTo(receiver);
    let send: () => void = noop;
    const result = {} as { [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> };

    keys.forEach(<TSrcKey extends keyof TSrcMap>(key: TSrcKey) => {
      supply.needs(
        sources[key][AfterEvent__symbol]()((...event: EventKeeper.Event<TSrcMap[TSrcKey]>) => {
          result[key] = event;
          send();
        }).needs(supply),
      );
    });

    if (!supply.isOff) {
      send = () => dispatch(result);
    }
  };

  const latestEvent = (): [{ readonly [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> }] => {
    const result = {} as { [K in keyof TSrcMap]: EventKeeper.Event<TSrcMap[K]> };

    keys.forEach(<TSrcKey extends keyof TSrcMap>(key: TSrcKey) => onceEvent(sources[key][AfterEvent__symbol]())({
        supply: new Supply(),
        receive: (_ctx, ...event: EventKeeper.Event<TSrcMap[TSrcKey]>) => (result[key as keyof TSrcMap] = event),
      }));

    return [result];
  };

  return afterEventBy(shareEvents(afterEventBy(registerReceiver, latestEvent)));
}
