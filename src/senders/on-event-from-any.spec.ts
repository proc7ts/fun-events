import { EventInterest } from '../event-interest';
import { EventNotifier } from '../event-notifier';
import { OnEvent, onNever } from '../on-event';
import { onEventFromAny } from './on-event-from-any';
import Mock = jest.Mock;

describe('onEventFromAny', () => {

  let source1: EventNotifier<[string]>;
  let source2: EventNotifier<[string]>;
  let fromAny: OnEvent<[string]>;
  let mockReceiver: Mock<void, [string]>;
  let interest: EventInterest;

  beforeEach(() => {
    source1 = new EventNotifier();
    source2 = new EventNotifier();
    fromAny = onEventFromAny(source1, source2);
    mockReceiver = jest.fn();
    interest = fromAny(mockReceiver);
  });

  it('receives events from any source', () => {
    source1.send('1');
    expect(mockReceiver).toHaveBeenCalledWith('1');
    source1.send('2');
    expect(mockReceiver).toHaveBeenCalledWith('2');
  });
  it('does not send any events without sources', () => {
    expect(onEventFromAny()).toBe(onNever);
  });
  it('stops sending events when interest is lost', () => {
    interest.off();
    source1.send('1');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('keeps sending events when some of the sources exhausts', () => {
    source1.done('reason1');
    source2.send('2');
    expect(mockReceiver).toHaveBeenCalledWith('2');
  });
  it('exhausts when all sources exhaust', () => {

    const mockDone = jest.fn();

    interest.whenDone(mockDone);
    source1.done('reason1');
    source2.done('reason2');

    expect(mockDone).toHaveBeenCalledWith('reason2');

    source1.send('3');
    expect(mockReceiver).not.toHaveBeenCalled();
  });
});
