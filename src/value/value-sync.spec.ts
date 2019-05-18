import { asis } from 'call-thru';
import { EventEmitter } from '../event-emitter';
import { EventInterest } from '../event-interest';
import { trackValue } from './track-value';
import { ValueSync } from './value-sync';
import { ValueTracker } from './value-tracker';

describe('ValueSync', () => {

  let v1: ValueTracker<number>;
  let ei1: EventInterest;
  let v2: ValueTracker<number>;
  let ei2: EventInterest;
  let v3: ValueTracker<number>;
  let ei3: EventInterest;
  let sync: ValueSync<number>;

  beforeEach(() => {
    sync = new ValueSync(0);
    v1 = trackValue(1);
    v2 = trackValue(2);
    v3 = trackValue(3);
    ei1 = sync.sync('out', v1);
    ei2 = sync.sync(v2);
    ei3 = sync.sync(v3);
  });

  it('initializes the added values', () => {
    expect(sync.it).toBe(0);
    expect(v1.it).toBe(0);
    expect(v2.it).toBe(0);
    expect(v3.it).toBe(0);
  });
  it('initializes from the added values', () => {

    sync.sync('in', trackValue(4));

    expect(sync.it).toBe(4);
    expect(v1.it).toBe(4);
    expect(v2.it).toBe(4);
    expect(v3.it).toBe(4);
  });
  it('synchronizes values between each other', () => {
    v2.it = 11;
    expect(v1.it).toBe(11);
    expect(v2.it).toBe(11);
    expect(v3.it).toBe(11);
    expect(sync.it).toBe(11);
  });
  it('updates synchronized values', () => {
    sync.it = 11;
    expect(v1.it).toBe(11);
    expect(v2.it).toBe(11);
    expect(v3.it).toBe(11);
    expect(sync.it).toBe(11);
  });
  it('stops synchronization when interest lost', () => {
    ei2.off();
    v1.it = 11;
    v2.it = 13;
    expect(v1.it).toBe(11);
    expect(v2.it).toBe(13);
    expect(v3.it).toBe(11);
    expect(sync.it).toBe(11);
  });
  it('synchronizes with values nested in source sender', () => {

    const v4 = trackValue(4);
    const source = new EventEmitter<[ValueTracker<number>]>();

    sync.sync(source, asis);
    source.send(v4);
    expect(sync.it).toBe(v4.it);
  });
  it('synchronizes with values nested in source keeper', () => {

    const v4 = trackValue(4);
    const source = trackValue(v4);

    sync.sync(source, asis);
    expect(sync.it).toBe(v4.it);
  });

  describe('done', () => {
    it('stops synchronization', () => {

      const mockWhenDone = jest.fn();
      const reason = 'some reason';

      ei1.whenDone(mockWhenDone);
      sync.done(reason);
      expect(mockWhenDone).toHaveBeenCalledWith(reason);

      v2.it = 999;
      expect(sync.it).toBe(0);
    });
  });
});
