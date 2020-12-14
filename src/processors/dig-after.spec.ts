import { asis, Supply } from '@proc7ts/primitives';
import { AfterEvent } from '../after-event';
import { isEventKeeper } from '../base';
import { trackValue, ValueTracker } from '../value';
import { digAfter } from './dig-after';

describe('digAfter', () => {

  let tracker: ValueTracker<ValueTracker<string>>;
  let nested1: ValueTracker<string>;
  let nested2: ValueTracker<string>;
  let extract: jest.Mock<ValueTracker<string>, [ValueTracker<string>]>;
  let result: AfterEvent<[string]>;
  let receiver: jest.Mock<void, [string]>;
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
    expect(receiver).toHaveBeenCalledWith('1');
    tracker.it = nested2;
    expect(receiver).toHaveBeenCalledWith('2');
    nested2.it = '3';
    expect(receiver).toHaveBeenCalledWith('3');
  });
});
