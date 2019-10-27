import { AfterEvent, afterEventBy, afterNever } from '../after-event';
import { EventReceiver } from '../event-receiver';
import { eventSupply } from '../event-supply';
import { trackValue, ValueTracker } from '../value';
import { afterEach } from './after-each';
import Mock = jest.Mock;

describe('afterEach', () => {

  let source1: ValueTracker<string>;
  let source2: ValueTracker<string>;
  let fromEach: AfterEvent<[string][]>;
  let mockReceiver: Mock<void, [string][]>;

  beforeEach(() => {
    source1 = trackValue('init1');
    source2 = trackValue('init2');
    fromEach = afterEach(source1, source2);
    mockReceiver = jest.fn();
  });

  it('sends initial event only once', () => {
    fromEach(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith(['init1'], ['init2']);
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('does not send anything without sources', () => {
    fromEach(mockReceiver);
    expect(afterEach()).toBe(afterNever);
  });
  it('sends updates', () => {
    fromEach(mockReceiver);
    mockReceiver.mockClear();
    source1.it = 'update1';
    expect(mockReceiver).toHaveBeenCalledWith(['update1'], ['init2']);
    source2.it = 'update2';
    expect(mockReceiver).toHaveBeenCalledWith(['update1'], ['update2']);
  });
  it('stops sending updates once their supply is cut off', () => {

    const supply = fromEach(mockReceiver);

    mockReceiver.mockClear();
    supply.off();
    source1.it = 'update';
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('stops sending updates when their supply is cut off during registration', () => {

    const reason = 'some reason';
    const stopper = afterEventBy<[string]>(() => {

      const stop = eventSupply();

      stop.off(reason);

      return stop;
    });

    const mockOff = jest.fn();

    fromEach = afterEach(stopper, source2);
    fromEach(mockReceiver).whenOff(mockOff);

    expect(mockReceiver).not.toHaveBeenCalled();
    expect(mockOff).toHaveBeenCalledWith(reason);
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {

    const recurrentReceiver = jest.fn();

    mockReceiver.mockImplementation(
        function (this: EventReceiver.Context<[string][]>) {
          this.onRecurrent(recurrentReceiver);
          source1.it = 'recurrent';
        });

    fromEach(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith(['init1'], ['init2']);
    expect(recurrentReceiver).toHaveBeenCalledWith(['recurrent'], ['init2']);
  });
});
