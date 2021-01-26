import { asis, Supply } from '@proc7ts/primitives';
import { AfterEvent } from '../after-event';
import { afterSent } from '../keepers';
import { EventEmitter } from '../senders';
import { deduplicateAfter } from './deduplicate-after';

describe('deduplicateAfter', () => {

  let source: EventEmitter<[string, string?]>;
  let dedup: AfterEvent<[string?]>;
  let receiver: jest.Mock<void, [string?]>;
  let supply: Supply;

  beforeEach(() => {
    source = new EventEmitter();
    dedup = afterSent<[string?, string?]>(
        source,
        () => [],
    ).do(
        deduplicateAfter(),
    );
    supply = dedup(receiver = jest.fn());
  });

  it('reports the initial event', async () => {
    expect(receiver).toHaveBeenCalledWith();
    expect(receiver).toHaveBeenCalledTimes(1);
    expect(await dedup).toBeUndefined();
  });
  it('reports an update', async () => {
    source.send('update');
    expect(receiver).toHaveBeenLastCalledWith('update');
    expect(receiver).toHaveBeenCalledTimes(2);
    expect(await dedup).toBe('update');
  });
  it('does not report a duplicate', () => {
    source.send('update');
    source.send('update');
    expect(receiver).toHaveBeenLastCalledWith('update');
    expect(receiver).toHaveBeenCalledTimes(2);
  });
  it('reports multiple updates', () => {
    source.send('update', '1');
    source.send('update', '2');
    source.send('update', '2');
    expect(receiver).toHaveBeenCalledWith('update', '1');
    expect(receiver).toHaveBeenLastCalledWith('update', '2');
    expect(receiver).toHaveBeenCalledTimes(3);
  });
  it('reports updates after cutting off', async () => {
    source.send('update');
    supply.off();

    expect(await dedup).toBeUndefined();

    const receiver2 = jest.fn();

    dedup(receiver2);
    expect(receiver2).toHaveBeenCalledWith();

    source.send('update2');
    expect(receiver2).toHaveBeenLastCalledWith('update2');
    expect(receiver2).toHaveBeenCalledTimes(2);

    expect(receiver).not.toHaveBeenCalledWith('update2');
  });
  it('is cut off when the source cut off', async () => {
    source.supply.off('reason');
    expect(await supply.whenDone().catch(asis)).toBe('reason');
  });
});
