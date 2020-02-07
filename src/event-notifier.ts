/**
 * @packageDocumentation
 * @module fun-events
 */
import { eventReceiver, EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';
import { eventSupply, EventSupply, EventSupply__symbol, eventSupplyOf, EventSupplyPeer } from './event-supply';

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
export class EventNotifier<E extends any[]> implements EventSender<E>, EventSupplyPeer {

  /**
   * @internal
   */
  private readonly _rcvs = new Set<EventReceiver.Generic<E>>();

  readonly [EventSupply__symbol]: EventSupply;

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event  An event to send represented by function call arguments.
   */
  readonly send: (this: this, ...event: E) => void = receiveEventsByEach(this._rcvs);

  constructor() {
    this[EventSupply__symbol] = eventSupply(reason => {
      this._rcvs.forEach(({ supply }) => supply.off(reason));
    });
  }

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

    const generic = eventReceiver(receiver);

    this._rcvs.add(generic);

    return generic.supply.needs(this).whenOff(() => this._rcvs.delete(generic));
  }

  /**
   * Removes all registered event receivers and cuts off corresponding event supplies.
   *
   * After this method call they won't receive any events. While new receivers would be cut off immediately upon
   * registration.
   *
   * @param reason  A reason to stop sending events.
   *
   * @returns `this` instance.
   */
  done(reason?: any): this {
    eventSupplyOf(this).off(reason);
    return this;
  }

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
