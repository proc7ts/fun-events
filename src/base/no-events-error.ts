/**
 * An error indicating a failure to receive an expected event.
 *
 * This happens e.g. when receiver registered in {@link EventKeeper event keeper}, but the latter has no events to send.
 * This may happen when no fallback passed to {@link afterEventBy} function, while the given supplier did not send
 * any events.
 *
 * @category Core
 */
export class NoEventsError extends TypeError {

  /**
   * Constructs an error.
   *
   * @param message - Error message.
   */
  constructor(message = 'No events to send') {
    super(message);
  }

}
