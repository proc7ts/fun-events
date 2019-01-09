import { EventProducer } from '../event-producer';
import { EventInterest } from '../event-interest';
import { EventConsumer } from '../event-consumer';

export type DomEventListener<E extends Event> = EventConsumer<[E]>;

/**
 * DOM event producer is an `EventProducer` accepting DOM event listener and its registration options as arguments.
 */
export abstract class DomEventProducer<E extends Event> extends EventProducer<[E]> {

  /**
   * Converts an event consumer registration function to event producer.
   *
   * @param register An event consumer registration function returning an event interest.
   *
   * @returns An event producer instance registering consumers with `register` function.
   */
  static by<E extends Event>(
      register: (
          this: void,
          listener: DomEventListener<E>,
          opts?: AddEventListenerOptions | boolean) => EventInterest):
      DomEventProducer<E> {

    const producer = ((
        listener: (this: void, event: E) => void,
        opts?: AddEventListenerOptions | boolean) => register(listener, opts)) as DomEventProducer<E>;

    Object.setPrototypeOf(producer, DomEventProducer.prototype);

    return producer;
  }

}
