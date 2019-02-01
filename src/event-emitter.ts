import { EventProducer } from './event-producer';
import { EventSource } from './event-source';
import { EventNotifier } from './event-notifier';

/**
 * Event emitter is a handy implementation of event producer along with methods for emitting events.
 *
 * Extends `EventNotifier` by making its `on()` method implement an `EventProducer` interface.
 *
 * Can be used as `EventSource`.
 *
 * @param <E> An event type. This is a list of event consumer parameter types.
 * @param <R> Event processing result. This is a type of event consumer result.
 */
export class EventEmitter<E extends any[], R = void> extends EventNotifier<E, R> implements EventSource<E, R> {

  /**
   * Call this method to start event consumption.
   *
   * This is an `EventProducer` implementation. Consumers registered with it will be notified on emitted events.
   */
  readonly on = EventProducer.of<E, R>(consumer => super.on(consumer));

  get [EventSource.on](): EventProducer<E, R> {
    return this.on;
  }

}
