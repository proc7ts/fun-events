/**
 * @module fun-events
 */
import { noop } from 'call-thru';
import { AfterEvent, afterEventFrom, afterEventOr, afterNever } from '../after-event';
import { AfterEvent__symbol, EventKeeper } from '../event-keeper';
import { EventNotifier } from '../event-notifier';
import { EventReceiver } from '../event-receiver';

/**
 * Builds an [[AfterEvent]] registrar of receivers of events sent by each of the `sources`.
 *
 * @category Core
 * @typeparam E  A type of events sent by each source.
 * @param sources  An array of source event keepers.
 *
 * @returns An event keeper sending events received from each event keeper. Each event item is an event tuple originated
 * from event keeper under the same index in `sources` array.
 */
export function afterEventFromEach<E extends any[]>(...sources: EventKeeper<E>[]): AfterEvent<E[]> {
  if (!sources.length) {
    return afterNever;
  }

  return afterEventOr(registerReceiver, latestEvent).share();

  function registerReceiver(receiver: EventReceiver<E[]>) {

    const notifier = new EventNotifier<E[]>();
    const interest = notifier.on(receiver);
    let send: () => void = noop;
    const result: E[] = [];

    sources.forEach(readFrom);

    if (!interest.done) {
      send = () => notifier.send(...result);
    }

    return interest;

    function readFrom(source: EventKeeper<E>, index: number) {
      interest.needs(source[AfterEvent__symbol]((...event) => {
        result[index] = event;
        send();
      }).needs(interest));
    }
  }

  function latestEvent() {

    const result: E[] = [];

    sources.forEach(source =>
        afterEventFrom(source)
            .once((...event) => result.push(event)));

    return result;
  }
}
