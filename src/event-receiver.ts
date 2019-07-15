/**
 * Event receiver is a function that is called on each event sent by `EventSender` when registered.
 *
 * To register an event receiver just call the event sender's `[OnEvent__symbol]` or event keeper's
 * `[AfterEvent__symbol]` method with this event receiver as argument.
 *
 * A _recurrent event_ is an event sent from inside event receiver and targeted the same receiver. Recurrent event
 * processing is scheduled until after the current event processing finishes. To handle recurrent events in a specific
 * way the event receiver may utilize an event processing context available as `this` parameter.
 *
 * @typeparam E An event type. This is a tuple of event receiver parameter types.
 * @param this An event processing context.
 * @param event An event represented by function call arguments.
 *
 * @returns Either `void` or recurrent event receiver.
 */
export type EventReceiver<E extends any[]> = (this: EventReceiver.Context<E>, ...event: E) => void;

export namespace EventReceiver {

  /**
   * Event processing context passed to each event receiver as `this` parameter.
   */
  export interface Context<E extends any[]> {

    /**
     * Schedules the given event receiver to be called to process recurrent event(s).
     *
     * If called during event processing the recurrent events will be sent to the given `receiver` after current event
     * processed instead of original one.
     *
     * If called multiple times the latest `receiver` will be used.
     *
     * If not called the recurrent events will be sent to original event receiver.
     *
     * > This method should be called __before__ the recurrent event issued. Otherwise it may happen that recurrent
     * > event will be ignored in some situations. E.g. when it is issued during receiver registration.
     *
     * @param receiver Recurrent events receiver.
     */
    afterRecurrent(receiver: EventReceiver<E>): void;

  }

}

/**
 * Creates an event receiver function that dispatches event to the given event receiver.
 *
 * @param receiver An event receivers to dispatch event to.
 *
 * @returns An event receiver function that does not utilize event processing context an thus can be called directly.
 */
export function receiveEventsBy<E extends any[]>(
    receiver: EventReceiver<E>,
): (this: void, ...event: E) => void  {
  return receiveEventsByEach([receiver]);
}

/**
 * Creates an event receiver function that dispatches events to each of the given event receivers.
 *
 * @param receivers An iterable of event receivers to dispatch event to.
 *
 * @returns An event receiver function that does not utilize event processing context an thus can be called directly.
 */
export function receiveEventsByEach<E extends any[]>(
    receivers: Iterable<EventReceiver<E>>,
): (this: void, ...event: E) => void  {

  let send: (this: void, event: E) => void = sendNonRecurrent;

  return (...event) => send(event);

  function sendNonRecurrent(event: E) {

    let actualReceivers = receivers;
    const received: E[] = [];

    send = sendRecurrent;

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

    function sendRecurrent(recurrent: E) {
      received.push(recurrent);
    }
  }
}

function processEvent<E extends any[]>(receivers: Iterable<EventReceiver<E>>, event: E): EventReceiver<E>[] {

  const recurrentReceivers: EventReceiver<E>[] = [];

  for (const receiver of receivers) {

    const idx = recurrentReceivers.length;

    recurrentReceivers.push(receiver);
    receiver.call(
        {
          afterRecurrent(recurrentReceiver) {
            recurrentReceivers[idx] = recurrentReceiver;
          },
        },
        ...event);
  }

  return recurrentReceivers;
}
