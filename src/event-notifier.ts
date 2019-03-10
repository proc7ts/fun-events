import { EventReceiver } from './event-receiver';
import { eventInterest, EventInterest } from './event-interest';
import { EventSender, OnEvent__symbol } from './event-sender';

/**
 * Event notifier can be used to register event receivers and send events to them.
 *
 * It does not implement an `OnEvent` interface though. Use an `EventEmitter` if you need one.
 *
 * Manages a list of registered event receivers, and removes them from the list once they lose their interest
 * (i.e. the `off()` is called on the returned event interest instance).
 *
 * Can be used as `EventSender`.
 *
 * @param <E> An event type. This is a list of event receiver parameter types.
 */
export class EventNotifier<E extends any[], R = void> implements EventSender<E> {

  /**
   * @internal
   */
  private readonly _receivers = new Map<number, EventReceiver<E>>();

  /**
   * @internal
   */
  private _seq = 0;

  /**
   * The number of registered event receivers.
   */
  get size(): number {
    return this._receivers.size;
  }

  [OnEvent__symbol](receiver: EventReceiver<E>): EventInterest {
    return this.on(receiver);
  }

  /**
   * Registers an event receiver.
   *
   * Receivers registered with this method will receive the emitted events.
   *
   * An `[OnEvent__symbol]` method is an alias of this one.
   *
   * @param receiver A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the `off()` method of returned event
   * interest is called.
   */
  on(receiver: EventReceiver<E>): EventInterest {

    const id = ++this._seq;

    this._receivers.set(id, receiver);
    return eventInterest(() => this._receivers.delete(id));
  }

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event An event to send represented by function call arguments.
   */
  send(...event: E): void {
    this._receivers.forEach(receiver => receiver(...event));
  }

  /**
   * Removes all registered event receivers.
   *
   * After this method call they won't receive events any more.
   */
  clear() {
    this._receivers.clear();
  }

}
