import { AfterEvent, afterEventBy, afterNever } from '../after-event';
import { eventInterest } from '../event-interest';
import { EventReceiver } from '../event-receiver';
import { trackValue, ValueTracker } from '../value';
import { afterEventFromEach } from './after-event-from-each';
import Mock = jest.Mock;

describe('afterEventFromEach', () => {

  let source1: ValueTracker<string>;
  let source2: ValueTracker<string>;
  let fromEach: AfterEvent<[string][]>;
  let mockReceiver: Mock<void, [string][]>;

  beforeEach(() => {
    source1 = trackValue('init1');
    source2 = trackValue('init2');
    fromEach = afterEventFromEach(source1, source2);
    mockReceiver = jest.fn();
  });

  it('sends initial event only once', () => {
    fromEach(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith(['init1'], ['init2']);
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('does not send anything without sources', () => {
    fromEach(mockReceiver);
    expect(afterEventFromEach()).toBe(afterNever);
  });
  it('sends updates', () => {
    fromEach(mockReceiver);
    mockReceiver.mockClear();
    source1.it = 'update1';
    expect(mockReceiver).toHaveBeenCalledWith(['update1'], ['init2']);
    source2.it = 'update2';
    expect(mockReceiver).toHaveBeenCalledWith(['update1'], ['update2']);
  });
  it('stops sending updates when interest is lost', () => {

    const interest = fromEach(mockReceiver);

    mockReceiver.mockClear();
    interest.off();
    source1.it = 'update';
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('stops sending updates when interest is lost during registration', () => {

    const reason = 'some reason';
    const stopper = afterEventBy<[string]>(() => {

      const stop = eventInterest();

      stop.off(reason);

      return stop;
    });

    const mockDone = jest.fn();

    fromEach = afterEventFromEach(stopper, source2);
    fromEach(mockReceiver).whenDone(mockDone);

    expect(mockReceiver).not.toHaveBeenCalled();
    expect(mockDone).toHaveBeenCalledWith(reason);
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {

    const recurrentReceiver = jest.fn();

    mockReceiver.mockImplementation(
        function (this: EventReceiver.Context<[string][]>) {
          this.afterRecurrent(recurrentReceiver);
          source1.it = 'recurrent';
        });

    fromEach(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith(['init1'], ['init2']);
    expect(recurrentReceiver).toHaveBeenCalledWith(['recurrent'], ['init2']);
  });
});
