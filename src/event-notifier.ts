import { noop } from 'call-thru';
import { eventInterest, EventInterest } from './event-interest';
import { EventReceiver, receiveEventsByEach } from './event-receiver';
import { EventSender, OnEvent__symbol } from './event-sender';

type ReceiverInfo<E extends any[]> = [EventReceiver<E>, (this: void, reason?: any) => void];

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

    let whenDone: (this: EventInterest, reason?: any) => void = noop;
    const interest = eventInterest(noop, {
      whenDone: callback => whenDone = callback,
    });

    const rcv: ReceiverInfo<E> = [receiver, reason => whenDone.call(interest, reason)];

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
    this._rcvs.forEach(([, done]) => done(reason));
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
