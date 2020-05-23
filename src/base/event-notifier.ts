/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { receiveByEach } from './event-notifier.impl';
import { eventReceiver, EventReceiver } from './event-receiver';
import { eventSupply, EventSupply, EventSupply__symbol, eventSupplyOf, EventSupplyPeer } from './event-supply';

/**
 * Event notifier can be used to register event receivers and send events to them.
 *
 * It does not implement an [[EventSender]] interface though. Use an [[EventEmitter]] if you need one.
 *
 * Manages a list of registered event receivers, and removes them from the list once their supplies
 * are {@link EventSupply.off cut off}.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export class EventNotifier<E extends any[]> implements EventSupplyPeer {

  /**
   * @internal
   */
  private _rcs?: Set<EventReceiver.Generic<E>>;

  readonly [EventSupply__symbol]: EventSupply;

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event  An event to send represented by function call arguments.
   */
  readonly send: (this: this, ...event: E) => void;

  constructor() {

    const rcs = this._rcs = new Set<EventReceiver.Generic<E>>();

    this.send = receiveByEach(rcs);
    this[EventSupply__symbol] = eventSupply(() => {
      rcs.clear();
      delete this._rcs;
    });
  }

  /**
   * The number of currently registered event receivers.
   */
  get size(): number {
    return this._rcs ? this._rcs.size : 0;
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
    const supply = generic.supply.needs(this);
    const receivers = this._rcs;

    if (receivers && !supply.isOff) {
      receivers.add(generic);
      supply.whenOff(() => receivers.delete(generic));
    }

    return supply;
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
