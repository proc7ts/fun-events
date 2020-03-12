/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventNotifier, EventReceiver, EventSender, EventSupply, OnEvent__symbol } from '../base';
import { OnEvent, onEventBy, receiveOnEvent } from '../on-event';

/**
 * Event emitter is a handy implementation of [[OnEvent]] sender.
 *
 * Extends [[EventNotifier]] by making its [[EventNotifier.on]] method implement an [[OnEvent]] interface.
 *
 * @category Core
 * @typeparam E  An event type. This is a list of event receiver parameter types.
 */
export class EventEmitter<E extends any[]> extends EventNotifier<E> implements EventSender<E> {

  /**
   * Returns an [[OnEvent]] sender.
   */
  on(): OnEvent<E>;
  on(receiver: EventReceiver<E>): EventSupply;
  on(receiver?: EventReceiver<E>): OnEvent<E> | EventSupply {
    return (this.on = /*#__INLINE__*/ receiveOnEvent(onEventBy<E>(receiver => super.on(receiver))))(receiver);
  }

  [OnEvent__symbol](): OnEvent<E> {
    return this.on();
  }

}
