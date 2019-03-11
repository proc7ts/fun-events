import { noop } from 'call-thru';
import { EventEmitter } from '../event-emitter';
import { OnEvent, onEventBy } from '../on-event';
import { StatePath, statePath, StateUpdateReceiver } from './state-events';
import { eventInterest, EventInterest } from '../event-interest';
import { EventSender, OnEvent__symbol } from '../event-sender';

/**
 * A state update receivers registration function interface.
 */
export interface OnStateUpdate extends OnEvent<[StatePath, any, any]> {

  (receiver: StateUpdateReceiver): EventInterest;

  once(receiver: StateUpdateReceiver): EventInterest;

}

class PathEntry {

  readonly emitter = new EventEmitter<[StatePath, any, any]>();
  private readonly _nested = new Map<PropertyKey, PathEntry>();

  constructor(private readonly _drop: () => void) {
    this.emitter.on((path, newValue, oldValue) => {
      path = statePath(path);

      const key = path[0];
      const nested = this._nested.get(key);

      if (nested) {
        nested.emitter.send(path.slice(1), newValue, oldValue);
      }
    });
  }

  on(receiver: StateUpdateReceiver): EventInterest {

    const entry = this;
    const interest = this.emitter.on(receiver);

    return eventInterest(() => {
      interest.off();
      entry._dropIfEmpty();
    });
  }

  nest(key: PropertyKey): PathEntry {

    const found = this._nested.get(key);

    if (found) {
      return found;
    }

    const created = new PathEntry(() => this._remove(key));

    this._nested.set(key, created);

    return created;
  }

  private _remove(key: PropertyKey) {
    this._nested.delete(key);
    this._dropIfEmpty();
  }

  private _dropIfEmpty() {
    if (!this._nested.size && this.emitter.size <= 1) {
      this._drop();
    }
  }

}

class Trackers {

  private readonly _root = new PathEntry(noop);

  on(path: StatePath.Normalized, receiver: StateUpdateReceiver): EventInterest {
    return this._entry(path).on(receiver);
  }

  send<V>(path: StatePath.Normalized, newValue: V, oldValue: V) {
    this._root.emitter.send(path, newValue, oldValue);
  }

  private _entry(path: StatePath.Normalized): PathEntry {

    let entry = this._root;

    for (const key of path) {
      entry = entry.nest(key);
    }

    return entry;
  }

}

// tslint:disable-next-line:no-use-before-declare
class SubStateTracker implements StateTracker {

  readonly update: StateUpdateReceiver = (<V>(path: StatePath, newValue: V, oldValue: V) => {
    this._trackers.send([...this._path, ...statePath(path)], newValue, oldValue);
  });

  readonly onUpdate: OnStateUpdate =
      onEventBy<[StatePath, any, any]>(receiver => this._trackers.on(this._path, receiver));

  constructor(private readonly _trackers: Trackers, private readonly _path: StatePath.Normalized) {
  }

  // noinspection JSUnusedGlobalSymbols
  get _tracker() {
    return this;
  }

  get [OnEvent__symbol](): OnStateUpdate {
    return this.onUpdate;
  }

  track(path: StatePath): SubStateTracker {
    path = statePath(path);
    if (!path.length) {
      return this; // Path to itself.
    }
    return new SubStateTracker(this._trackers, [...this._path, ...path]);
  }

}

/**
 * State changes tracker.
 *
 * A state is a tree-like structure of sub-states (nodes) available under `StatePath`.
 *
 * When node modified an `update` function should be called. Then all state update receivers registered by `onUpdate`
 * registrar will receive a notification.
 */
export class StateTracker implements EventSender<[StatePath, any, any]> {

  /**
   * @internal
   */
  readonly _tracker: SubStateTracker = new SubStateTracker(new Trackers(), []);

  // noinspection JSCommentMatchesSignature
  /**
   * Registers component state updates listener.
   *
   * A state update will be sent to it whenever an `update()` function is called.
   *
   * @param listener A state updates receiver to register.
   *
   * @return An event interest instance.
   */
  get onUpdate(): OnStateUpdate {
    return this._tracker.onUpdate;
  }

  get [OnEvent__symbol](): OnStateUpdate {
    return this.onUpdate;
  }

  // noinspection JSCommentMatchesSignature
  /**
   * Updates the component state.
   *
   * All receivers registered with `onUpdate()` will receive this update.
   *
   * @param <V> A type of changed value.
   * @param key Changed value key.
   * @param newValue New value.
   * @param oldValue Previous value.
   */
  get update(): StateUpdateReceiver {
    return this._tracker.update;
  }

  /**
   * Starts tracking of partial state under the given path.
   *
   * @param path A path to state part.
   *
   * @return New partial state tracker.
   */
  track(path: StatePath): StateTracker {

    const subTracker = this._tracker.track(path);

    return subTracker === this._tracker ? this : subTracker;
  }

}
