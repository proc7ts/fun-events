import { AfterEvent, afterEventBy, afterNever } from '../after-event';
import { eventSupply } from '../event-supply';
import { EventReceiver } from '../event-receiver';
import { trackValue, ValueTracker } from '../value';
import { afterEventFromAll } from './after-event-from-all';
import Mock = jest.Mock;

describe('afterEventFromAll', () => {

  let source1: ValueTracker<string>;
  let source2: ValueTracker<number>;
  let fromAll: AfterEvent<[{ source1: [string], source2: [number] }]>;
  let mockReceiver: Mock<void, [{ source1: [string], source2: [number] }]>;

  beforeEach(() => {
    source1 = trackValue('init');
    source2 = trackValue(1);
    fromAll = afterEventFromAll({ source1, source2 });
    mockReceiver = jest.fn();
  });

  it('sends initial event only once', () => {
    fromAll(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['init'], source2: [1] });
    expect(mockReceiver).toHaveBeenCalledTimes(1);
  });
  it('does not send anything without sources', () => {
    fromAll(mockReceiver);
    expect(afterEventFromAll({})).toBe(afterNever);
  });
  it('sends updates', () => {
    fromAll(mockReceiver);
    mockReceiver.mockClear();
    source1.it = 'update';
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['update'], source2: [1] });
    source2.it = 2;
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['update'], source2: [2] });
  });
  it('stops sending updates once their supply is cut off', () => {

    const supply = fromAll(mockReceiver);

    mockReceiver.mockClear();
    supply.off();
    source1.it = 'update';
    expect(mockReceiver).not.toHaveBeenCalled();
  });
  it('stops sending updates if their supply is cut off during registration', () => {

    const reason = 'some reason';
    const stopper = afterEventBy<[string]>(() => {

      const stop = eventSupply();

      stop.off(reason);

      return stop;
    });

    const mockOff = jest.fn();

    fromAll = afterEventFromAll({ source1: stopper, source2 });
    fromAll(mockReceiver).whenOff(mockOff);

    expect(mockReceiver).not.toHaveBeenCalled();
    expect(mockOff).toHaveBeenCalledWith(reason);
  });
  it('sends recurrent event sent during registration to recurrent receiver', () => {

    const recurrentReceiver = jest.fn();

    mockReceiver.mockImplementation(
        function (this: EventReceiver.Context<[{ source1: [string], source2: [number] }]>) {
          this.afterRecurrent(recurrentReceiver);
          source1.it = 'recurrent';
        });

    fromAll(mockReceiver);
    expect(mockReceiver).toHaveBeenCalledWith({ source1: ['init'], source2: [1] });
    expect(recurrentReceiver).toHaveBeenCalledWith({ source1: ['recurrent'], source2: [1] });
  });
});
