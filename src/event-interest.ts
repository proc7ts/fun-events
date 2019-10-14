/**
 * @module fun-events
 */
import { noop } from 'call-thru';

/**
 * An interest for receiving the events.
 *
 * This is what returned when registering an event receiver.
 *
 * Once the receiver is no longer interested in receiving events, an [[EventInterest.off]] method should be called
 * to indicate the lost of interest in receiving events.
 *
 * By convenience, [[EventInterest]] instances should be constructed using [[eventInterest]] function.
 *
 * @category Core
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
   * @param reason  An optional reason why interest is lost. This will be reported to [[EventInterest.whenDone]]
   * callback.
   * @returns A lost event interest instance.
   */
  abstract off(reason?: any): EventInterest;

  /**
   * Registers a callback function that will be called when events exhausted and will more events will be sent to the
   * receiver. This callback will be called immediately when [[EventInterest.done]] become `true`.
   *
   * Not every event sender informs on that, but it is guaranteed that this callback will be called when
   * [[EventInterest.off]] method is called.
   *
   * @param callback  A callback function that receives an optional event completion reason as its only parameter.
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
   * @param other  An event interest this one depends on.
   *
   * @return `this` instance.
   */
  needs(other: EventInterest): this {
    other.whenDone(reason => this.off(reason));
    return this;
  }

}

/**
 * Constructs new [[EventInterest]] instance.
 *
 * @category Core
 * @param off  A function to call to indicate the lost of interest in receiving events. Accepts a single parameter
 * indicating the reason of losing interest that will be passed to [[EventInterest.whenDone]] callbacks.
 * No-op by default.
 * @param whenDone  A function that will be called to register events exhaust callback. This function will be called
 * at most once. The [[EventInterest.off]] method would call the registered callbacks in any case.
 */
export function eventInterest(
    off: (this: EventInterest, reason?: any) => void = noop,
    {
      whenDone = noop,
    }: {
      whenDone?: (callback: (this: EventInterest, reason?: any) => void) => void;
    } = {},
): EventInterest {

  let alreadyDone = false;
  let doneReason: any | undefined;
  let doneCallback: (reason?: any) => void = noop;

  whenDone(doWhenDone);

  class Interest extends EventInterest {

    // noinspection JSMethodCanBeStatic
    get done() {
      return alreadyDone;
    }

    off(reason?: any): EventInterest {
      off.call(this, reason);
      doWhenDone(reason);
      return this;
    }

    whenDone(callback: (reason?: any) => void): this {
      if (alreadyDone) {
        callback(doneReason);
      } else {

        const prev = doneCallback;

        doneCallback = reason => {
          prev(reason);
          callback(reason);
        };
      }

      return this;
    }

  }

  return new Interest();

  function doWhenDone(reason?: any) {
    if (!alreadyDone) {

      const callback = doneCallback;

      alreadyDone = true;
      doneReason = reason;
      doneCallback = noop;
      callback(reason);
    }
  }
}

class NoInterest extends EventInterest {

  // noinspection JSMethodCanBeStatic
  get done() {
    return true;
  }

  off() {
    return this;
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
 *
 * @category Core
 */
export function noEventInterest(): EventInterest {
  return NO_INTEREST;
}
