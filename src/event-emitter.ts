/**
 * @packageDocumentation
 * @module fun-events
 */
import { EventNotifier } from './event-notifier';
import { EventSender, OnEvent__symbol } from './event-sender';
import { OnEvent, onEventBy } from './on-event';

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
   * An [[OnEvent]] sender.
   *
   * The `[OnEvent__symbol]` property is an alias of this one.
   */
  readonly on = onEventBy<E>(receiver => super.on(receiver));

  readonly [OnEvent__symbol]: OnEvent<E> = this.on;

}
