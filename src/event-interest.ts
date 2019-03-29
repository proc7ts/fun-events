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
   * Whether events targeted corresponding receiver are exhausted.
   *
   * `true` indicates that no events will be sent to the registered receiver.
   */
  abstract readonly done: boolean;

  /**
   * A method to call to indicate the lost of interest in receiving events.
   *
   * Once called, the corresponding event receiver will no longer receive events.
   *
   * Calling this method for the second time, or when the events exhausted, has no effect.
   *
   * @param reason An optional reason why interest is lost. This will be reported to `whenDone()` callback.
   */
  abstract off(reason?: any): void;

  /**
   * Registers a callback function that will be called when events exhausted and will more events will be sent to the
   * receiver. This callback will be called immediately when `done` is `true`.
   *
   * Not every event sender informs on that, but it is guaranteed that this callback will be called when `off()` method
   * is called.
   *
   * @param callback A callback function that receives an optional event completion reason as its only parameter.
   * By convenience an `undefined` reason means normal completion.
   *
   * @returns `this` instance.
   */
  abstract whenDone(callback: (reason?: any) => void): this;

  /**
   * Declares this event interest depends on another one.
   *
   * Once the events received with the `other` event interest are exhausted, this event interest would be lost.
   *
   * @param other An event interest this one depends on.
   *
   * @return `this` instance.
   */
  needs(other: EventInterest): this {
    other.whenDone(reason => this.off(reason));
    return this;
  }

}

/**
 * Constructs new `EventInterest` instance.
 *
 * @param off A function to call to indicate the lost of interest in receiving events. Accepts a single parameter
 * indicating the reason of losing interest that will be passed to `whenDone()` callbacks.
 * @param whenDone A function that will be called to register events exhaust callback. This function will be called
 * at most once. The `off()` method would call the registered callbacks in any case.
 */
export function eventInterest(
    off: (this: EventInterest, reason?: any) => void,
    {
      whenDone = noop,
    }: {
      whenDone?: (callback: (this: EventInterest, reason?: any) => void) => void;
    } = {}): EventInterest {

  let _done = false;
  let _reason: any | undefined;
  let _whenDone: (reason?: any) => void = noop;

  function doWhenDone(reason?: any) {
    if (!_done) {

      const callback = _whenDone;

      _done = true;
      _reason = reason;
      _whenDone = noop;
      callback(reason);
    }
  }

  whenDone(doWhenDone);

  class Interest extends EventInterest {

    get done() {
      return _done;
    }

    off(reason?: any): void {
      off.call(this, reason);
      doWhenDone(reason);
    }

    whenDone(callback: (reason?: any) => void): this {
      if (_done) {
        callback(_reason);
      } else {

        const prev = _whenDone;

        _whenDone = reason => {
          prev(reason);
          callback(reason);
        };
      }

      return this;
    }

  }

  return new Interest();
}

class NoInterest extends EventInterest {

  get done() {
    return true;
  }

  get off() {
    return noop;
  }

  whenDone(callback: (reason?: any) => void): this {
    callback();
    return this;
  }

}

const NO_INTEREST = /*#__PURE__*/ new NoInterest();

/**
 * Returns a missing event interest.
 *
 * This is handy e.g. when initializing fields.
 */
export function noEventInterest(): EventInterest {
  return NO_INTEREST;
}
