import { EventSupply } from '../base';
import { OnEvent } from '../on-event';
import { EventEmitter } from './event-emitter';
import { onAny } from './on-any';
import { onNever } from './on-never';
import Mock = jest.Mock;

describe('onAny', () => {

  let source1: EventEmitter<[string]>;
  let source2: EventEmitter<[string]>;
  let fromAny: OnEvent<[string]>;
  let mockReceiver: Mock<void, [string]>;
  let supply: EventSupply;

  beforeEach(() => {
    source1 = new EventEmitter();
    source2 = new EventEmitter();
    fromAny = onAny(source1, source2);
    mockReceiver = jest.fn();
    supply = fromAny(mockReceiver);
  });

  it('receives events from any source', () => {
    source1.send('1');
    expect(mockReceiver).toHaveBeenCalledWith('1');
    source1.send('2');
    expect(mockReceiver).toHaveBeenCalledWith('2');
  });
  it('does not send any events without sources', () => {
    expect(onAny()).toBe(onNever);
  });
  it('stops sending events once their supply is cut off', () => {
    supply.off();
    source1.send('1');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('keeps sending events when some of source supplies are cut off', () => {
    source1.done('reason1');
    source2.send('2');
    expect(mockReceiver).toHaveBeenCalledWith('2');
  });
  it('cuts off events supply when all source supplies are cut off', () => {

    const mockOff = jest.fn();

    supply.whenOff(mockOff);
    source1.done('reason1');
    source2.done('reason2');

    expect(mockOff).toHaveBeenCalledWith('reason2');

    source1.send('3');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
});
