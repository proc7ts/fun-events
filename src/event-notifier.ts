import { noop } from 'call-thru';
import { eventInterest, EventInterest } from './event-interest';
import { EventReceiver } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';

class ReceiverInfo<E extends any[]> {

  private _whenDone: (reason?: any) => void = noop;

  constructor(readonly recv: EventReceiver<E>) {
  }

  interest(): EventInterest {
    return eventInterest(noop, {
      whenDone: callback => this._whenDone = callback,
    });
  }

  done(reason?: any) {
    this._whenDone(reason);
  }

}

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
export class EventNotifier<E extends any[]> implements EventSender<E> {

  /**
   * @internal
   */
  private readonly _rcvs = new Map<number, ReceiverInfo<E>>();

  /**
   * @internal
   */
  private _seq = 0;

  /**
   * The number of registered event receivers.
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
   * An `[OnEvent__symbol]` method is an alias of this one.
   *
   * @param receiver A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the `off()` method of returned event
   * interest is called.
   */
  on(receiver: EventReceiver<E>): EventInterest {

    const id = ++this._seq;

    const rcv = new ReceiverInfo(receiver);
    this._rcvs.set(id, rcv);

    return rcv.interest().whenDone(() => this._rcvs.delete(id));
  }

  /**
   * Sends the given `event` to all registered receivers.
   *
   * @param event An event to send represented by function call arguments.
   */
  send(...event: E): void {
    this._rcvs.forEach(receiver => receiver.recv(...event));
  }

  /**
   * Removes all registered event receivers.
   *
   * After this method call they won't receive events. Informs all corresponding event interests on that by calling
   * the callbacks registered with `whenDone()`.
   *
   * @param reason A reason to stop sending events to receivers.
   *
   * @returns `this` instance.
   */
  done(reason?: any): this {
    this._rcvs.forEach(recv => recv.done(reason));
    this._rcvs.clear();
    return this;
  }

}
