import { eventReceiver, EventReceiver } from './event-receiver';

/**
 * Creates an event receiver function that dispatches events to each of the given event receivers.
 *
 * @internal
 * @param receivers - An iterable of event receivers to dispatch event to.
 *
 * @returns An event receiver function that does not utilize event processing context an thus can be called directly.
 */
export function receiveByEach<TEvent extends any[]>(
  receivers: Iterable<EventReceiver.Generic<TEvent>>,
): (this: void, ...event: TEvent) => void {
  let send: (this: void, event: TEvent) => void = sendNonRecurrent;

  return (...event) => send(event);

  function sendNonRecurrent(event: TEvent): void {
    let actualReceivers = receivers;
    const received: TEvent[] = [];

    send = (recurrent: TEvent) => received.push(recurrent);

    try {
      for (;;) {
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

/**
 * @internal
 */
function processEvent<TEvent extends any[]>(
  receivers: Iterable<EventReceiver.Generic<TEvent>>,
  event: TEvent,
): EventReceiver.Generic<TEvent>[] {
  const recurrentReceivers: EventReceiver.Generic<TEvent>[] = [];

  for (const receiver of receivers) {
    const idx = recurrentReceivers.length;

    recurrentReceivers.push(receiver);

    const context: EventReceiver.Context<TEvent> = {
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
