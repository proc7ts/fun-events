/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply, SupplyPeer } from '@proc7ts/primitives';
import { receiveByEach } from './event-notifier.impl';
import { eventReceiver, EventReceiver } from './event-receiver';

/**
 * Event notifier can be used to register event receivers and send events to them.
 *
 * It does not implement an {@link EventSender} interface though. Use an {@link EventEmitter} if you need one.
 *
 * Manages a list of registered event receivers, and removes them from the list once their supplies
 * are {@link Supply.off cut off}.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export class EventNotifier<TEvent extends any[]> implements SupplyPeer {

  /**
   * @internal
   */
  private _rcs?: Set<EventReceiver.Generic<TEvent>>;

  readonly supply: Supply;

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event - An event to send represented by function call arguments.
   */
  readonly send: (this: this, ...event: TEvent) => void;

  constructor() {

    const rcs = this._rcs = new Set<EventReceiver.Generic<TEvent>>();

    this.send = receiveByEach(rcs);
    this.supply = new Supply(() => {
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
   * @param receiver - A receiver of events to register.
   *
   * @returns A supply of events to the given `receiver`.
   */
  on(receiver: EventReceiver<TEvent>): Supply {

    const generic = eventReceiver(receiver);
    const supply = generic.supply.needs(this);
    const receivers = this._rcs;

    if (receivers && !supply.isOff) {
      receivers.add(generic);
      supply.whenOff(() => receivers.delete(generic));
    }

    return supply;
  }

}
