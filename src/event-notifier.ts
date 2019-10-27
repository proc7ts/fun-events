/**
 * @module fun-events
 */
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { eventSupply, EventSupply } from './event-supply';

type ReceiverInfo<E extends any[]> = [EventReceiver<E>, EventSupply];

/**
 * Event notifier can be used to register event receivers and send events to them.
 *
 * It does not implement an [[OnEvent]] interface though. Use an [[EventEmitter]] if you need one.
 *
 * Manages a list of registered event receivers, and removes them from the list once their supplies
 * are {@link EventSupply.off cut off}.
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

  [OnEvent__symbol](receiver: EventReceiver<E>): EventSupply {
    return this.on(receiver);
  }

  /**
   * Registers an event receiver.
   *
   * Receivers registered with this method will receive the {@link send emitted} events.
   *
   * The `[OnEvent__symbol]` method is an alias of this one.
   *
   * @param receiver  A receiver of events to register.
   *
   * @returns A supply of events to the given `receiver`.
   */
  on(receiver: EventReceiver<E>): EventSupply {

    const supply = eventSupply();
    const rcv: ReceiverInfo<E> = [receiver, supply];

    this._rcvs.add(rcv);

    return supply.whenOff(() => this._rcvs.delete(rcv));
  }

  /**
   * Removes all registered event receivers and cuts off corresponding event supplies.
   *
   * After this method call they won't receive any events.
   *
   * @param reason  A reason to stop sending events.
   *
   * @returns `this` instance.
   */
  done(reason?: any): this {
    this._rcvs.forEach(([, supply]) => supply.off(reason));
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
          onRecurrent(recurrentReceiver) {
            recurrentReceivers[idx] = recurrentReceiver;
          },
        },
        ...event);
  }

  return recurrentReceivers;
}
