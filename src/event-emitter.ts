import { OnEvent } from './on-event';
import { EventSender, OnEvent__symbol } from './event-sender';
import { EventNotifier } from './event-notifier';

/**
 * Event emitter is a handy implementation of `OnEvent` registrar along with methods for sending events.
 *
 * Extends `EventNotifier` by making its `on()` method implement an `OnEvent` interface.
 *
 * @param <E> An event type. This is a list of event receiver parameter types.
 */
export class EventEmitter<E extends any[]> extends EventNotifier<E> implements EventSender<E> {

  /**
   * An `OnEvent` registrar of events sent by this sender.
   *
   * An `[OnEvent__symbol]` property is an alias of this one.
   *
   * @param receiver A receiver of events.
   *
   * @returns An event interest. The events will be sent to `receiver` until the `off()` method of returned event
   * interest is called.
   */
  readonly on = OnEvent.by<E>(receiver => super.on(receiver));

  get [OnEvent__symbol](): OnEvent<E> {
    return this.on;
  }

}
