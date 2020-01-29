/**
 * @packageDocumentation
 * @module fun-events
 */
import { noop } from 'call-thru';
import { AfterEvent, afterEventBy, afterSupplied } from '../after-event';
import { AfterEvent__symbol, EventKeeper } from '../event-keeper';
import { EventNotifier } from '../event-notifier';
import { EventReceiver } from '../event-receiver';

/**
 * Builds an [[AfterEvent]] keeper of events sent by each of the `sources`.
 *
 * @category Core
 * @typeparam E  A type of events sent by each source.
 * @param sources  An array of source event keepers.
 *
 * @returns An event keeper sending events received from each source keeper. Each event item is an event tuple
 * originated from source keeper under its index in `sources` array.
 */
export function afterEach<E extends any[]>(...sources: EventKeeper<E>[]): AfterEvent<E[]> {

  return afterEventBy(registerReceiver, latestEvent).share();

  function registerReceiver(receiver: EventReceiver.Generic<E[]>): void {

    const notifier = new EventNotifier<E[]>();
    const supply = notifier.on(receiver);
    let send: () => void = noop;
    const result: E[] = [];

    sources.forEach((source, index) => {
      supply.needs(source[AfterEvent__symbol]((...event) => {
        result[index] = event;
        send();
      }).needs(supply));
    });

    if (!supply.isOff) {
      send = () => notifier.send(...result);
    }
  }

  function latestEvent(): E[] {

    const result: E[] = [];

    sources.forEach(
        source => afterSupplied(source).once(
            (...event) => result.push(event),
        ),
    );

    return result;
  }
}
