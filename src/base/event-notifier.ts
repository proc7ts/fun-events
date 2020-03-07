/**
 * @packageDocumentation
 * @module fun-events
 */
import { receiveByEach } from './event-notifier.impl';
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
  private readonly _rcs = new Set<EventReceiver.Generic<E>>();

  readonly [EventSupply__symbol]: EventSupply;

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event  An event to send represented by function call arguments.
   */
  readonly send: (this: this, ...event: E) => void = receiveByEach(this._rcs);

  constructor() {
    this[EventSupply__symbol] = eventSupply(() => this._rcs.clear());
  }

  /**
   * The number of currently registered event receivers.
   */
  get size(): number {
    return this._rcs.size;
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

    this._rcs.add(generic);

    return generic.supply.needs(this).whenOff(() => this._rcs.delete(generic));
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
