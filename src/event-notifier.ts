/**
 * @module fun-events
 */
import { eventInterest, EventInterest } from './event-interest';
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';

type ReceiverInfo<E extends any[]> = [EventReceiver<E>, EventInterest];

/**
 * Event notifier can be used to register event receivers and send events to them.
 *
 * It does not implement an [[OnEvent]] interface though. Use an `EventEmitter` if you need one.
 *
 * Manages a list of registered event receivers, and removes them from the list once they lose their interest
 * (i.e. the [[EventInterest.off]] is called on the returned event interest instance).
 *
 * Can be used as [[EventSender]].
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export class EventNotifier<E extends any[]> implements EventSender<E> {

  /**
   * @internal
   */
  private readonly _rcvs = new Set<ReceiverInfo<E>>();

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event  An event to send represented by function call arguments.
   */
  readonly send: (this: this, ...event: E) => void = receiveEventsByEach(allReceivers(this._rcvs));

  /**
   * The number of currently registered event receivers.
   */
  get size(): number {
    return this._rcvs.size;
  }

  [OnEvent__symbol](receiver: EventReceiver<E>): EventInterest {
    return this.on(receiver);
  }

  /**
   * Registers an event receiver.
   *
   * Receivers registered with this method will receive the emitted events.
   *
   * The `[OnEvent__symbol]` method is an alias of this one.
   *
   * @param receiver  A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the [[EventInterest.off]] method
   * of returned event interest is called.
   */
  on(receiver: EventReceiver<E>): EventInterest {

    const interest = eventInterest();
    const rcv: ReceiverInfo<E> = [receiver, interest];

    this._rcvs.add(rcv);

    return interest.whenDone(() => this._rcvs.delete(rcv));
  }

  /**
   * Removes all registered event receivers.
   *
   * After this method call they won't receive events. Informs all corresponding event interests on that by calling
   * the callbacks registered with [[EventInterest.whenDone]].
   *
   * @param reason  A reason to stop sending events to receivers.
   *
   * @returns `this` instance.
   */
  done(reason?: any): this {
    this._rcvs.forEach(([, interest]) => interest.off(reason));
    this._rcvs.clear();
    return this;
  }

}

function allReceivers<E extends any[]>(rcvs: Set<ReceiverInfo<E>>): Iterable<EventReceiver<E>> {
  return {
    * [Symbol.iterator]() {
      for (const [receiver] of rcvs) {
        yield receiver;
      }
    }
  };
}

/**
 * Creates an event receiver function that dispatches events to each of the given event receivers.
 *
 * @category Core
 * @param receivers  An iterable of event receivers to dispatch event to.
 *
 * @returns An event receiver function that does not utilize event processing context an thus can be called directly.
 */
function receiveEventsByEach<E extends any[]>(
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
