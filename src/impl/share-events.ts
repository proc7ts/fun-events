import { Supply } from '@proc7ts/primitives';
import { EventNotifier, EventReceiver, sendEventsTo } from '../base';
import { OnEvent } from '../on-event';

/**
 * @internal
 */
export function shareEvents<TEvent extends any[]>(
    supplier: OnEvent<TEvent>,
): (receiver: EventReceiver.Generic<TEvent>) => void {

  const sharer = new EventSharer<TEvent>(supplier);

  return sharer.on.bind(sharer);
}

class EventSharer<TEvent extends any[]> extends EventNotifier<TEvent> {

  private _on: SharedEventDispatcher<TEvent>;

  constructor(readonly supplier: OnEvent<TEvent>) {
    super();
    this._on = this._onInit();
  }

  on(receiver: EventReceiver.Generic<TEvent>): Supply {
    this._on.on(receiver);
    return receiver.supply;
  }

  /**
   * Initial dispatcher applied when there are no receivers.
   */
  private _onInit(): SharedEventDispatcher<TEvent> {
    return {
      on: receiver => {

        const initialEvents: TEvent[] = [];
        const sharedSupply = new Supply(() => this._on = this._onInit());
        const onFirst = this._on = this._onFirst(sharedSupply, initialEvents);

        try {
          onFirst.on(receiver);
          this.supplier({
            supply: sharedSupply,
            receive: (_ctx, ...event) => this._on.dispatch(...event),
          });
        } finally {
          if (this._on === onFirst) {
            this._on = this._onNext(sharedSupply, initialEvents);
          }
        }
      },
      dispatch: null!, // Initial dispatcher never dispatches events
    };
  }

  /**
   * A dispatcher applied while the first receiver is still registering, but not registered yet.
   *
   * Records emitted events to dispatch them to all receivers.
   */
  private _onFirst(sharedSupply: Supply, initialEvents: TEvent[]): SharedEventDispatcher<TEvent> {
    return {
      on: receiver => this._addReceiver(receiver, sharedSupply, initialEvents),
      dispatch: (...event) => {
        // Record initial event.
        initialEvents.push(event);
        this.send(...event);
      },
    };
  }

  /**
   * A dispatcher applied after the first receiver registered.
   *
   * Dispatches initial events to new receivers until new event received.
   */
  private _onNext(sharedSupply: Supply, initialEvents: TEvent[]): SharedEventDispatcher<TEvent> {
    return {
      on: receiver => this._addReceiver(receiver, sharedSupply, initialEvents),
      dispatch: (...event) => {
        // An event received after initial ones.
        // Stop dispatching initial events.
        initialEvents.length = 0;
        this.send(...event);
      },
    };
  }

  private _addReceiver(
      receiver: EventReceiver.Generic<TEvent>,
      sharedSupply: Supply,
      initialEvents: TEvent[],
  ): void {
    sharedSupply.cuts(receiver);

    super.on(receiver).whenOff(reason => {
      if (!this.size) {
        sharedSupply.off(reason);
      }
    });

    if (initialEvents.length) {
      // Dispatch initial events.

      const dispatch = sendEventsTo(receiver);

      initialEvents.forEach(event => dispatch(...event));
    }
  }

}

interface SharedEventDispatcher<TEvent extends any[]> {

  on(this: void, receiver: EventReceiver.Generic<TEvent>): void;

  dispatch(...event: TEvent): void;

}

