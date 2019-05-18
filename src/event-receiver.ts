/**
 * Event receiver is a function that is called on each event sent by `EventSender` when registered.
 *
 * To register an event receiver just call the event sender's `[OnEvent__symbol]` or event keeper's
 * `[AfterEvent__symbol]` method with this event receiver as argument.
 *
 * @typeparam E An event type. This is a tuple of event receiver parameter types.
 * @param event An event represented by function call arguments.
 */
export type EventReceiver<E extends any[]> = (this: void, ...event: E) => void;
