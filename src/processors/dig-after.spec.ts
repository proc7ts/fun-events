import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { asis } from '@proc7ts/primitives';
import { Supply } from '@proc7ts/supply';
import { Mock } from 'jest-mock';
import { AfterEvent } from '../after-event';
import { isEventKeeper } from '../base';
import { EventEmitter } from '../senders';
import { trackValue, ValueTracker } from '../value';
import { digAfter } from './dig-after';

describe('digAfter', () => {

  let tracker: ValueTracker<ValueTracker<string>>;
  let nested1: ValueTracker<string>;
  let nested2: ValueTracker<string>;
  let extract: Mock<ValueTracker<string>, [ValueTracker<string>]>;
  let result: AfterEvent<[string]>;
  let receiver: Mock<void, [string]>;
  let supply: Supply;

  beforeEach(() => {
    nested1 = trackValue('1');
    nested2 = trackValue('2');
    tracker = trackValue(nested1);
    receiver = jest.fn();
    extract = jest.fn(asis);
    result = tracker.read.do(digAfter(extract));
    supply = result(receiver);
  });
  afterEach(() => {
    supply.off();
  });

  it('returns event keeper', () => {
    expect(isEventKeeper(result)).toBe(true);
  });
  it('receives nested events', () => {
    expect(receiver).toHaveBeenLastCalledWith('1');
    tracker.it = nested2;
    expect(receiver).toHaveBeenLastCalledWith('2');
    nested2.it = '3';
    expect(receiver).toHaveBeenLastCalledWith('3');
  });

  describe('from event sender', () => {

    let source: EventEmitter<[ValueTracker<string>]>;

    beforeEach(() => {
      source = new EventEmitter();
      result = source.on.do(digAfter(extract, () => ['fallback']));
      supply = result(receiver);
    });

    it('receives nested events', () => {
      expect(receiver).toHaveBeenLastCalledWith('fallback');
      source.send(nested1);
      expect(receiver).toHaveBeenLastCalledWith('1');
      source.send(nested2);
      expect(receiver).toHaveBeenLastCalledWith('2');
      nested2.it = '3';
      expect(receiver).toHaveBeenLastCalledWith('3');
    });
  });
});
