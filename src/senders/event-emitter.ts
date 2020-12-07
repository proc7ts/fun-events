/**
 * @packageDocumentation
 * @module @proc7ts/fun-events
 */
import { Supply } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver, EventSender, OnEvent__symbol } from '../base';
import { OnEvent, onEventBy } from '../on-event';

/**
 * Event emitter is a handy implementation of {@link OnEvent} sender.
 *
 * Extends {@link EventNotifier} by making its {@link EventNotifier.on} method implement an {@link OnEvent} interface.
 *
 * @category Core
 * @typeParam TEvent - An event type. This is a list of event receiver parameter types.
 */
export class EventEmitter<TEvent extends any[]> extends EventNotifier<TEvent> implements EventSender<TEvent> {

  /**
   * Returns an {@link OnEvent} sender.
   */
  on(): OnEvent<TEvent>;
  on(receiver: EventReceiver<TEvent>): Supply;
  on(receiver?: EventReceiver<TEvent>): OnEvent<TEvent> | Supply {
    return (this.on = onEventBy<TEvent>(receiver => super.on(receiver)).F)(receiver);
  }

  [OnEvent__symbol](): OnEvent<TEvent> {
    return this.on();
  }

}
