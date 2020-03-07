import { eventReceiver, EventReceiver } from './event-receiver';

/**
 * Creates an event receiver function that dispatches events to each of the given event receivers.
 *
 * @internal
 * @param receivers  An iterable of event receivers to dispatch event to.
 *
 * @returns An event receiver function that does not utilize event processing context an thus can be called directly.
 */
export function receiveByEach<E extends any[]>(
    receivers: Iterable<EventReceiver.Generic<E>>,
): (this: void, ...event: E) => void {

  let send: (this: void, event: E) => void = sendNonRecurrent;

  return (...event) => send(event);

  function sendNonRecurrent(event: E): void {

    let actualReceivers = receivers;
    const received: E[] = [];

    send = (recurrent: E) => received.push(recurrent);

    try {
      for (; ;) {
        actualReceivers = processEvent(actualReceivers, event);

        const recurrent = received.shift();

        if (!recurrent) {
          break;
        }

        event = recurrent;
      }
    } finally {
      send = sendNonRecurrent;
    }
  }
}

function processEvent<E extends any[]>(
    receivers: Iterable<EventReceiver.Generic<E>>,
    event: E,
): EventReceiver.Generic<E>[] {

  const recurrentReceivers: EventReceiver.Generic<E>[] = [];

  for (const receiver of receivers) {

    const idx = recurrentReceivers.length;

    recurrentReceivers.push(receiver);

    const context: EventReceiver.Context<E> = {
      onRecurrent(recurrentReceiver) {
        recurrentReceivers[idx] = eventReceiver({
          supply: receiver.supply,
          receive(_context, ...recurrentEvent) {
            recurrentReceiver(...recurrentEvent);
          },
        });
      },
    };

    receiver.receive(context, ...event);
  }

  return recurrentReceivers;
}
