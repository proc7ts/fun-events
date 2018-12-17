import { noop } from 'call-thru';

/**
 * An interest for the events.
 *
 * This is what returned returned from `EventProducer` when registering an event consumer.
 *
 * Once the consumer is no longer interested in receiving events, an `off()` method should be called, indicated the
 * lost of interest.
 */
export interface EventInterest {

  /**
   * A method to call to indicate the lost of interest in receiving events.
   *
   * Once called, the corresponding event consumer would no longer be called.
   *
   * Calling this method for the second time has no effect.
   */
  off(): void;

}

export namespace EventInterest {

  /**
   * No-op event interest.
   *
   * This is handy to use e.g. to initialize the fields.
   */
  export const none: EventInterest = {
    off: noop,
  };

}
