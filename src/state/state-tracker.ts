import { noop } from 'call-thru';
import { EventEmitter } from '../event-emitter';
import { EventInterest, EventProducer } from '../event-producer';
import { StatePath, StateUpdater } from './state-events';

class PathEntry {

  readonly emitter = new EventEmitter<StateUpdater>();
  private readonly _nested = new Map<PropertyKey, PathEntry>();

  constructor(private readonly _drop: () => void) {
    this.emitter.on((path, newValue, oldValue) => {
      path = StatePath.of(path);

      const key = path[0];
      const nested = this._nested.get(key);

      if (nested) {
        nested.emitter.notify(path.slice(1), newValue, oldValue);
      }
    });
  }

  on(consumer: StateUpdater): EventInterest {

    const entry = this;
    const interest = this.emitter.on(consumer);

    return {
      off() {
        interest.off();
        entry._dropIfEmpty();
      },
    };
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
    if (!this._nested.size && this.emitter.consumers <= 1) {
      this._drop();
    }
  }

}

class Trackers {

  private readonly _root = new PathEntry(noop);

  on(path: StatePath.Normalized, consumer: StateUpdater): EventInterest {
    return this._entry(path).on(consumer);
  }

  notify<V>(path: StatePath.Normalized, newValue: V, oldValue: V) {
    this._root.emitter.notify(path, newValue, oldValue);
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

  readonly update: StateUpdater = (<V>(path: StatePath, newValue: V, oldValue: V) => {
    this._trackers.notify([...this._path, ...StatePath.of(path)], newValue, oldValue);
  });

  readonly onUpdate = EventProducer.of<StateUpdater>(consumer => this._trackers.on(this._path, consumer));

  constructor(private readonly _trackers: Trackers, private readonly _path: StatePath.Normalized) {
  }

  // noinspection JSUnusedGlobalSymbols
  get _tracker() {
    return this;
  }

  track(path: StatePath): SubStateTracker {
    path = StatePath.of(path);
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
 * When node modified an `update` function should be called. Then all update event consumers registered in `onUpdate`
 * event producer will receive a notification.
 */
export class StateTracker {

  /**
   * @internal
   */
  readonly _tracker: SubStateTracker = new SubStateTracker(new Trackers(), []);

  // noinspection JSCommentMatchesSignature
  /**
   * Registers component state updates listener.
   *
   * This listener will be notified when `update()` is called.
   *
   * @param listener A listener to notify on state updates.
   *
   * @return An event interest instance.
   */
  get onUpdate(): EventProducer<StateUpdater> {
    return this._tracker.onUpdate;
  }

  // noinspection JSCommentMatchesSignature
  /**
   * Updates the component state.
   *
   * All listeners registered with `onUpdate()` will be notified on this update.
   *
   * This method is also called by the function available under `[StateUpdater.key]` key.
   * The latter is preferred way to call it, as the caller won't depend on `StateSupport` feature then.
   *
   * @param <V> A type of changed value.
   * @param key Changed value key.
   * @param newValue New value.
   * @param oldValue Previous value.
   */
  get update(): StateUpdater {
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
