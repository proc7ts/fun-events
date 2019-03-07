import { noop } from 'call-thru';

/**
 * An interest for receiving the events.
 *
 * This is what returned when registering an event receiver.
 *
 * Once the receiver is no longer interested in receiving events, an `off()` method should be called to indicate the
 * lost of interest in receiving events.
 *
 * By convenience, `EventInterest` instances should be constructed using `eventInterest()` function.
 */
export abstract class EventInterest {

  /**
   * A method to call to indicate the lost of interest in receiving events.
   *
   * Once called, the corresponding event receiver will no longer receive events.
   *
   * Calling this method for the second time has no effect.
   */
  abstract off(): void;

}

class Interest extends EventInterest {
  constructor(readonly off: (this: EventInterest) => void) {
    super();
  }
}

/**
 * Constructs new `EventInterest` instance.
 *
 * @param off A function to call to indicate the lost of interest in receiving events.
 */
export function eventInterest(off: (this: EventInterest) => void): EventInterest {
  return new Interest(off);
}

class NoEventInterest extends EventInterest {
  off = noop;
}

const NONE = /*#__PURE__*/ new NoEventInterest();

/**
 * Returns a no-op event interest.
 *
 * This is handy e.g. when initializing fields.
 */
export function noEventInterest(): EventInterest {
  return NONE;
}
